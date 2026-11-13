let carrito = [];
let todosLosProductos = [];

const URL_EXCEL_CSV = "https://google.com";

function parsearFilaCSV(linea) {
    let resultado = [];
    let dentroDeComillas = false;
    let celdaActual = "";

    for (let i = 0; i < linea.length; i++) {
        let char = linea.charAt(i);
        if (char === '"') {
            dentroDeComillas = !dentroDeComillas;
        } else if (char === ',' && !dentroDeComillas) {
            resultado.push(celdaActual.trim());
            celdaActual = "";
        } else {
            celdaActual += char;
        }
    }
    resultado.push(celdaActual.trim());
    return resultado;
}

function ampliarImagen(url) {
    const modal = document.getElementById('mi-modal-imagen');
    const img = document.getElementById('imagen-ampliada');
    if (modal && img) {
        img.src = url;
        modal.style.display = 'flex';
    }
}

function dibujarProductos(listaProductos) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    listaProductos.forEach((producto) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-producto';
        tarjeta.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" onclick="ampliarImagen('${producto.imagen}')" onerror="this.src='https://placeholder.com'">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <div class="precio">${producto.precioTexto}</div>
            <button class="btn-agregar" onclick="agregarAlCarrito('${producto.id}', '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precioNum})">Agregar al carrito</button>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 1. Cargar los datos desde Google Sheets
fetch(URL_EXCEL_CSV)
    .then(respuesta => respuesta.text())
    .then(texto => {
        const filas = texto.split('\n').slice(1);

        filas.forEach((fila, indice) => {
            if (!fila.trim()) return;
            const columnas = parsearFilaCSV(fila);
            if (columnas.length < 5) return;

            const nombre = columnas.at(2) || "Sin nombre";
            const precioTexto = columnas.at(3) || "$0";
            const descripcion = columnas.at(4) || "";
            const imagen = columnas.at(5) || "https://placeholder.com";
            const precioNum = parseFloat(precioTexto.replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '').trim()) || 0;

            todosLosProductos.push({
                id: indice.toString(),
                nombre,
                precioTexto,
                precioNum,
                descripcion,
                imagen
            });
        });

        dibujarProductos(todosLosProductos);
    })
    .catch(error => console.error("Error cargando los productos desde Sheets:", error));

// 2. Funciones del carrito de compras
function agregarAlCarrito(id, nombre, precio) {
    const itemExistente = carrito.find(item => item.id === id);
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const listaContenedor = document.getElementById('lista-carrito');
    const montoTotalSpan = document.getElementById('monto-total');
    const btnContinuar = document.getElementById('btn-abrir-modal');

    if (carrito.length === 0) {
        listaContenedor.innerHTML = '<p style="color: #aaa; font-size: 13px; text-align: center;">El carrito está vacío.</p>';
        montoTotalSpan.innerText = '0';
        if (btnContinuar) btnContinuar.style.display = 'none';
        return;
    }

    listaContenedor.innerHTML = '';
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        const div = document.createElement('div');
        div.className = 'item-carrito';
        div.innerHTML = `
            <span>${item.nombre} (x${item.cantidad})</span>
            <span>$${subtotal.toLocaleString('es-AR')}</span>
        `;
        listaContenedor.appendChild(div);
    });

    montoTotalSpan.innerText = total.toLocaleString('es-AR');
    if (btnContinuar) btnContinuar.style.display = 'block';
}

// 3. Envío consolidado por Correo Electrónico
const btnFinalizar = document.getElementById('btn-finalizar');
if (btnFinalizar) {
    btnFinalizar.addEventListener('click', () => {
        const nombreCliente = document.getElementById('cliente-nombre')?.value.trim() || "No especificado";
        const telefonoCliente = document.getElementById('cliente-telefono')?.value.trim() || "No especificado";
        const tipoEntrega = document.querySelector('input[name="entrega_tipo"]:checked')?.value || "A convenir";
        const direccionCliente = document.getElementById('cliente-direccion')?.value.trim() || "No especificada";

        const correoDestino = "jonathan.pirillo@outlook.com";
        const asunto = `Nuevo Pedido Mayorista - ${nombreCliente}`;

        let cuerpoMensaje = "NUEVO PEDIDO MAYORISTA\n";
        cuerpoMensaje += "==============================\n";
        cuerpoMensaje += `Cliente: ${nombreCliente}\n`;
        cuerpoMensaje += `Teléfono: ${telefonoCliente}\n`;
        cuerpoMensaje += `Modalidad: ${tipoEntrega}\n`;
        if (tipoEntrega === "Envío a Domicilio") {
            cuerpoMensaje += `Dirección: ${direccionCliente}\n`;
        }
        cuerpoMensaje += "==============================\n\n";
        cuerpoMensaje += "DETALLE DEL PEDIDO:\n";

        let totalPedido = 0;
        carrito.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            totalPedido += subtotal;
            cuerpoMensaje += `- ${item.nombre} x${item.cantidad} - $${subtotal.toLocaleString('es-AR')}\n`;
        });

        cuerpoMensaje += `\nTotal Estimado: $${totalPedido.toLocaleString('es-AR')}`;

        const mailtoLink = `mailto:${correoDestino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoMensaje)}`;
        window.location.href = mailtoLink;
    });
}

// 4. Buscador en tiempo real
const inputBuscador = document.getElementById('buscador-productos');
if (inputBuscador) {
    inputBuscador.addEventListener('input', (e) => {
        const textoBuscado = e.target.value.toLowerCase().trim();
        const productosFiltrados = todosLosProductos.filter(producto => {
            return producto.nombre.toLowerCase().includes(textoBuscado) ||
                   producto.descripcion.toLowerCase().includes(textoBuscado);
        });
        dibujarProductos(productosFiltrados);
    });
}
