let carrito = [];

// Tu enlace CSV real de Google Sheets
const URL_EXCEL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5uh38kdfXIQI99v0WvPeoVSY9uJ6LTbsrP4H-mJhnHNHVFiqcqcrnZjyfChpw6w/pub?output=csv";

// Función para procesar correctamente las filas del CSV manejando comillas
function parsearFilaCSV(linea) {
    let resultado = [];
    let dentroDeComillas = false;
    let celdaActual = "";

    for (let i = 0; i < linea.length; i++) {
        let char = linea[i];
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

// 1. Cargar los datos desde Google Sheets
fetch(URL_EXCEL_CSV)
  .then(respuesta => respuesta.text())
  .then(texto => {
    const filas = texto.split('\n').slice(1); // Ignoramos la primera fila de títulos
    const contenedor = document.getElementById('contenedor-productos');
    
    filas.forEach((fila, indice) => {
      if (!fila.trim()) return;
      
      const columnas = parsearFilaCSV(fila);
      if (columnas.length < 5) return; // Saltamos filas incompletas

      // Mapeamos según el orden de tu archivo
      const nombre = columnas[2]; 
      const precioTexto = columnas[3] || "$0";
      const descripcion = columnas[4] || "";
      const imagen = columnas[5] || "https://unsplash.com";

      // Limpiamos el precio para convertirlo en número ($ 4.500 -> 4500)
      const precioNum = parseFloat(precioTexto.replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '').trim()) || 0;

      // Dibujamos la tarjeta visual del producto
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-producto';
      tarjeta.innerHTML = `
        <img src="${imagen}" alt="${nombre}" onerror="this.src='https://unsplash.com'">
        <h3>${nombre}</h3>
        <p>${descripcion}</p>
        <div class="precio">${precioTexto}</div>
        <button class="btn-agregar" onclick="agregarAlCarrito('${indice}', '${nombre.replace(/'/g, "\\'")}', ${precioNum})">Agregar al carrito</button>
      `;
      contenedor.appendChild(tarjeta);
    });
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
  const btnFinalizar = document.getElementById('btn-finalizar');
  
  if (carrito.length === 0) {
    listaContenedor.innerHTML = '<p style="color: #aaa; font-size: 13px;">El carrito está vacío.</p>';
    montoTotalSpan.innerText = '0';
    btnFinalizar.style.display = 'none';
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
  btnFinalizar.style.display = 'block';
}

// 3. Envío consolidado a WhatsApp
document.getElementById('btn-finalizar').addEventListener('click', () => {
  const nroTelefono = "5491127433172"; 
  let mensaje = "🛒 *NUEVO PEDIDO MAYORISTA*\n\n";
  let totalPedido = 0;
  
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    totalPedido += subtotal;
    mensaje += "▪️ " + item.nombre + " x" + item.cantidad + " - $" + subtotal.toLocaleString('es-AR') + "\n";
  });
  
  mensaje += "\n💰 *Total Estimado: $" + totalPedido.toLocaleString('es-AR') + "*";
  
  // SOLUCIÓN DEFINITIVA: Enlace oficial de la API de WhatsApp sin el punto y coma suelto
  const urlFinal = "https://whatsapp.com" + nroTelefono + "&text=" + encodeURIComponent(mensaje);
  window.open(urlFinal, '_blank');
});

