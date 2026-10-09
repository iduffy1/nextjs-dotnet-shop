using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<OrderStore>();

var app = builder.Build();

var products = new List<Product>
{
    new(1, "Touch probe stylus M2", "Ruby ball stylus, 2mm tip, 20mm length", 34.50m, "Probing"),
    new(2, "Kinematic probe mount", "Repeatable magnetic mount for CMM probes", 189.00m, "Probing"),
    new(3, "Calibration sphere 25mm", "Ceramic reference sphere with stem", 245.00m, "Calibration"),
    new(4, "Laser alignment target", "Retroreflector target for machine alignment", 412.00m, "Calibration"),
    new(5, "Stylus tool kit", "Wrenches and extension bars for stylus changes", 58.75m, "Accessories"),
};

var api = app.MapGroup("/api");

api.MapGet("/products", () => products);

api.MapGet("/products/{id:int}", async (int id) => 
    {
        return products.FirstOrDefault(p => p.Id == id) is {} product
            ? Results.Ok(product)
            : Results.NotFound();
    });

api.MapPost("/orders", (CreateOrderRequest request, OrderStore store) =>
{
    var errors = new Dictionary<string, string[]>();

    if (request.Lines is null || request.Lines.Count == 0)
        errors["lines"] = ["The order must contain at least one item."];

    var lines = new List<OrderLine>();
    foreach (var line in request.Lines ?? [])
    {
        var product = products.FirstOrDefault(p => p.Id == line.ProductId);
        if (product is null)
        {
            errors[$"lines[{line.ProductId}]"] = [$"Unknown product {line.ProductId}."];
            continue;
        }
        if (line.Quantity is < 1 or > 100)
        {
            errors[$"lines[{line.ProductId}]"] = ["Quantity must be between 1 and 100."];
            continue;
        }
        lines.Add(new OrderLine(product.Id, product.Name, line.Quantity, product.Price,
                                product.Price * line.Quantity));
    }

    if (errors.Count > 0)
        return Results.ValidationProblem(errors);

    var order = store.Add(lines);
    return Results.Created($"/api/orders/{order.Id}", order);
});

api.MapGet("/orders/{id:int}", (int id, OrderStore store) =>
    store.Get(id) is { } order ? Results.Ok(order) : Results.NotFound());

app.Run("http://localhost:5000");

record Product(int Id, string Name, string Description, decimal Price, string Category);

record OrderLineRequest(int ProductId, int Quantity);
record CreateOrderRequest(List<OrderLineRequest> Lines);
record OrderLine(int ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);
record Order(int Id, DateTimeOffset CreatedAt, List<OrderLine> Lines, decimal Total);

class OrderStore
{
    private readonly ConcurrentDictionary<int, Order> _orders = new();
    private int _nextId;

    public Order Add(List<OrderLine> lines)
    {
        var id = Interlocked.Increment(ref _nextId);
        var order = new Order(id, DateTimeOffset.UtcNow, lines, lines.Sum(l => l.LineTotal));
        _orders[id] = order;
        return order;
    }

    public Order? Get(int id) => _orders.GetValueOrDefault(id);
}