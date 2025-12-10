// --- 1. VARIABLES Y ESTADO DE LA APP ---
// Intentamos leer del LocalStorage, si no hay nada, iniciamos con arrays vacíos.
let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

// Referencias al DOM (HTML)
// Capturamos los elementos que vamos a manipular o escuchar
const formulario = document.getElementById("product-form");
const inputNombre = document.getElementById("product-name");
const inputPrecio = document.getElementById("product-price");
const inputCantidad = document.getElementById("product-quantity");

const contenedorProductos = document.getElementById("products-container");
const contenedorVentas = document.getElementById("sales-log");
const spanTotalStock = document.getElementById("total-stock");
const spanDinero = document.getElementById("total-money");
const btnBorrarHistorial = document.getElementById("btn-clear-history");

// --- 2. CLASES Y CONSTRUCTORES ---
// Usamos una clase para crear objetos "Producto" de forma ordenada
class Producto {
    constructor(nombre, precio, stock) {
        this.id = Date.now(); // Genera un ID único basado en el tiempo
        this.nombre = nombre.toUpperCase(); // Guardamos el nombre en mayúsculas
        this.precio = parseFloat(precio);
        this.stock = parseInt(stock);
    }
}

// --- 3. FUNCIONES (Lógica) ---

// Función para guardar en LocalStorage (la llamamos cada vez que algo cambia)
function guardarEnStorage() {
    localStorage.setItem("inventario", JSON.stringify(inventario));
    localStorage.setItem("ventas", JSON.stringify(ventas));
}

// Función para dibujar (renderizar) los productos en pantalla
function renderizarProductos() {
    // 1. Limpiamos el contenedor para no duplicar
    contenedorProductos.innerHTML = "";

    // 2. Recorremos el array de inventario
    inventario.forEach((producto) => {
        // Creamos el HTML de la tarjeta
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${producto.nombre}</h3>
            <p>Precio: $${producto.precio}</p>
            <p>Stock: <strong>${producto.stock}</strong></p>
            <button id="btn-${producto.id}" class="btn-vender">Vender</button>
        `;
        
        // Agregamos la tarjeta al contenedor
        contenedorProductos.appendChild(card);

        // Agregamos el evento al botón de ESTA tarjeta específica
        const botonVender = document.getElementById(`btn-${producto.id}`);
        botonVender.addEventListener("click", () => {
            venderProducto(producto.id);
        });
    });

    actualizarResumen();
}

// Función para dibujar el historial de ventas
function renderizarHistorial() {
    contenedorVentas.innerHTML = "";
    
    ventas.forEach((venta) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${venta.producto}</span>
            <span>+$${venta.precio}</span>
        `;
        contenedorVentas.appendChild(li);
    });
}

// Función para actualizar los totales del header
function actualizarResumen() {
    // Usamos reduce para contar stock total
    const totalStock = inventario.reduce((acc, prod) => acc + prod.stock, 0);
    // Usamos reduce para sumar el dinero ganado en ventas
    const totalDinero = ventas.reduce((acc, venta) => acc + venta.precio, 0);

    spanTotalStock.innerText = `Items en Stock: ${totalStock}`;
    spanDinero.innerText = `Dinero en Caja: $${totalDinero}`;
}

// Función Principal: Agregar Producto
function agregarProducto(e) {
    e.preventDefault(); // Evita que el formulario recargue la página

    const nombre = inputNombre.value;
    const precio = inputPrecio.value;
    const stock = inputCantidad.value;

    // Validación simple
    if (nombre === "" || precio === "" || stock === "") {
        alert("Por favor completa todos los campos"); // Ojo: idealmente usaríamos un div de error, pero alert es válido para validar inputs si no abusas.
        return;
    }

    // Creamos el objeto
    const nuevoProducto = new Producto(nombre, precio, stock);

    // Lo agregamos al array
    inventario.push(nuevoProducto);

    // Guardamos y actualizamos pantalla
    guardarEnStorage();
    renderizarProductos();
    
    // Reseteamos el form
    formulario.reset();
}

// Función Principal: Vender Producto
function venderProducto(id) {
    // Buscamos el producto en el array
    const productoEncontrado = inventario.find((prod) => prod.id === id);

    if (productoEncontrado.stock > 0) {
        // 1. Restamos stock
        productoEncontrado.stock--;
        
        // 2. Registramos la venta
        const registroVenta = {
            id: Date.now(),
            producto: productoEncontrado.nombre,
            precio: productoEncontrado.precio
        };
        ventas.push(registroVenta);

        // 3. Guardamos y redibujamos todo
        guardarEnStorage();
        renderizarProductos();
        renderizarHistorial();
    } else {
        alert("¡No hay stock de este producto!"); // Feedback al usuario
    }
}

// Función para borrar historial
function borrarHistorial() {
    ventas = [];
    guardarEnStorage();
    renderizarHistorial();
    actualizarResumen();
}

// --- 4. EVENTOS (Interacción) ---

// Escuchamos el envío del formulario
formulario.addEventListener("submit", agregarProducto);

// Escuchamos el botón de borrar historial
btnBorrarHistorial.addEventListener("click", borrarHistorial);

// --- 5. INICIALIZACIÓN ---
// Al cargar la página, dibujamos lo que haya en memoria
renderizarProductos();
renderizarHistorial();
actualizarResumen();