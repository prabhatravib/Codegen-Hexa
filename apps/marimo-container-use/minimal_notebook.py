import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    """Minimal test cell"""
    return "Hello from Marimo!"

@app.cell
def __():
    """Simple calculation"""
    x = 2 + 2
    return f"2 + 2 = {x}"

if __name__ == "__main__":
    app.run()
