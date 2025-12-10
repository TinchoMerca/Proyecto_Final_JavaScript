// --- 1. ESTADO Y VARIABLES ---
// Inicialización desde LocalStorage o arrays vacíos
let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

// Referencias al DOM
const formulario = document.getElementById("product-form");
const inputNombre = document.getElementById("product-name");
const inputPrecio = document.getElementById("product-price");
const inputCantidad = document.getElementById("product-quantity");

const contenedorProductos = document.getElementById("products-container");
const contenedorVentas = document.getElementById("sales-log");
const spanTotalStock = document.getElementById("total-stock");
const spanDinero = document.getElementById("total-money");
const btnBorrarHistorial = document.getElementById("btn-clear-history");

// --- 2. CLASES ---
class Producto {
    constructor(nombre, precio, stock) {
        this.id = Date.now();
        this.nombre = nombre.toUpperCase();
        this.precio = parseFloat(precio);
        this.stock = parseInt(stock);
    }
}

// --- 3. FUNCIONES ---

// Sincroniza los arrays con el almacenamiento del navegador
function guardarEnStorage() {
    localStorage.setItem("inventario", JSON.stringify(inventario));
    localStorage.setItem("ventas", JSON.stringify(ventas));
}

// Renderiza las tarjetas de productos en el HTML
function renderizarProductos() {
    contenedorProductos.innerHTML = ""; // Limpia contenedor para evitar duplicados

    inventario.forEach((producto) => {
        const card = document.createElement("div");
        card.className = "card";

        // Estilo condicional para stock bajo
        if (producto.stock <= 3) {
            card.classList.add("pocostock");
        }
            
        card.innerHTML = `
            <h3>${producto.nombre}</h3>
            <p>Precio: $${producto.precio}</p>
            <p>Stock: <strong>${producto.stock}</strong></p>
            <div class="card-actions">
                <button id="btn-vender-${producto.id}" class="btn-vender">Vender</button>
                <button id="btn-borrar-${producto.id}" class="btn-borrar">Eliminar</button>
            </div>
        `;
        contenedorProductos.appendChild(card);

        // Asignación de eventos dinámicos
        document.getElementById(`btn-vender-${producto.id}`).addEventListener("click", () => venderProducto(producto.id));
        document.getElementById(`btn-borrar-${producto.id}`).addEventListener("click", () => eliminarProducto(producto.id));
    });
    
    actualizarResumen();
}

// Renderiza el historial de ventas
function renderizarHistorial() {
    contenedorVentas.innerHTML = "";
    ventas.forEach((venta) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${venta.producto}</span> <span>+$${venta.precio}</span>`;
        contenedorVentas.appendChild(li);
    });
}

// Calcula y muestra los totales
function actualizarResumen() {
    const totalStock = inventario.reduce((acc, prod) => acc + prod.stock, 0);
    const totalDinero = ventas.reduce((acc, venta) => acc + venta.precio, 0);

    spanTotalStock.innerText = `Items en Stock: ${totalStock}`;
    spanDinero.innerText = `Dinero en Caja: $${totalDinero}`;
}

// Función Principal: Agregar o Actualizar Producto
function agregarProducto(e) {
    e.preventDefault();

    const nombre = inputNombre.value;
    const precio = inputPrecio.value;
    const stock = inputCantidad.value;

    // Validaciones
    if (nombre === "" || precio === "" || stock === "") {
        alert("Por favor completa todos los campos");
        return;
    }
    if (precio <= 0 || stock <= 0) {
        alert("El precio y la cantidad deben ser mayores a cero.");
        return;
    }

    // Verificar existencia para evitar duplicados
    const productoExistente = inventario.find(prod => prod.nombre === nombre.toUpperCase());

    if (productoExistente) {
        // Si existe, actualizamos stock y precio
        productoExistente.stock += parseInt(stock);
        productoExistente.precio = parseFloat(precio);
    } else {
        // Si no existe, creamos uno nuevo
        const nuevoProducto = new Producto(nombre, precio, stock);
        inventario.push(nuevoProducto);
    }

    guardarEnStorage();
    renderizarProductos();
    formulario.reset();
}

// Función Principal: Registrar Venta
function venderProducto(id) {
    const producto = inventario.find((prod) => prod.id === id);

    if (producto.stock > 0) {
        producto.stock--;
        
        ventas.push({
            id: Date.now(),
            producto: producto.nombre,
            precio: producto.precio
        });

        guardarEnStorage();
        renderizarProductos();
        renderizarHistorial();
    } else {
        alert("¡No hay stock de este producto!");
    }
}

// Elimina producto definitivamente
function eliminarProducto(id) {
    if(confirm("¿Estás seguro de que quieres eliminar este producto?")) {
        inventario = inventario.filter(prod => prod.id !== id);
        guardarEnStorage();
        renderizarProductos();
    }
}

function borrarHistorial() {
    ventas = [];
    guardarEnStorage();
    renderizarHistorial();
    actualizarResumen();
}

// --- 4. EVENTOS E INICIALIZACIÓN ---
formulario.addEventListener("submit", agregarProducto);
btnBorrarHistorial.addEventListener("click", borrarHistorial);

// Inicializar la app
renderizarProductos();
renderizarHistorial();
actualizarResumen();