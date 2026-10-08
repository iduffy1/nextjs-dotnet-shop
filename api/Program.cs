var builder = WebApplication.CreateBuilder(args);
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

app.Run("http://localhost:5000");

record Product(int Id, string Name, string Description, decimal Price, string Category);
