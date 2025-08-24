import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    return "Hello from Marimo!"

@app.cell
def __():
    return 42
