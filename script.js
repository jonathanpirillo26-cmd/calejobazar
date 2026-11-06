let carrito = [];
let todosLosProductos = []; // Lista en memoria para que funcione el buscador

// Tu enlace real de Google Sheets
const URL_EXCEL_CSV = "https://google.com";

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
    
    filas.forEach((fila, indice) => {
      if (!fila.trim()) return;
      
      const columnas = parsearFilaCSV(fila);
      if (columnas.length < 5) return;

      const nombre = columnas.at(2); 
      const precioTexto = columnas.at(3) || "$0";
      const descripcion = columnas.at(4) || "";
      const imagen = columnas.at(5) || "https://unsplash.com";

      const precioNum = parseFloat(precioTexto.replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '').trim()) || 0;

      // Guardamos cada producto en la lista general de memoria
      todosLosProductos.push({
        id: indice,
        nombre: nombre,
        precioTexto: precioTexto,
        precioNum: precioNum,
        descripcion: descripcion,
        imagen: imagen
      });
    });

    // Dibujamos el catálogo completo al iniciar
    mostrarProductosEnPantalla(todosLosProductos);
  })
  .catch(error => console.error("Error cargando los productos desde Sheets:", error));

// Función exclusiva para dibujar las tarjetas en la grilla visual
function mostrarProductosEnPantalla(lista) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;
    contenedor.innerHTML = ""; // Vaciamos la grilla
    
    if (lista.length === 0) {
        contenedor.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #aaa; margin: 40px 0;">No se encontraron productos que coincidan.</p>`;
        return;
    }

    lista.forEach(producto => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-producto';
      tarjeta.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" style="cursor: zoom-in;" onclick="abrirImagenGrande(this.src)" onerror="this.src='https://unsplash.com'">
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion}</p>
        <div class="precio">${producto.precioTexto}</div>
        <button class="btn-agregar" onclick="agregarAlCarrito('${producto.id}', '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precioNum})">Agregar al carrito</button>
      `;
      contenedor.appendChild(tarjeta);
    });
}

// 🔍 Conexión del buscador: Filtra en tiempo real al escribir
const inputBuscador = document.getElementById('buscador-productos');
if (inputBuscador) {
    inputBuscador.addEventListener('input', (e) => {
        const textoBuscado = e.target.value.toLowerCase().trim();
        
        const productosFiltrados = todosLosProductos.filter(producto => {
            return producto.nombre.toLowerCase().includes(textoBuscado) || 
                   producto.descripcion.toLowerCase().includes(textoBuscado);
        });
        
        mostrarProductosEnPantalla(productosFiltrados);
    });
}

// 2. Funciones del carrito de compras
function agregarAlCarrito(id, nombre, precio) {
  const itemExistente = carrito.find(item => item.id === id);
  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({ id: id, nombre: nombre, precio: precio, cantidad: 1 });
  }
  actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
  const listaContenedor = document.getElementById('lista-carrito');
  const montoTotalSpan = document.getElementById('monto-total');
  const btnFinalizar = document.getElementById('btn-finalizar');
  
  if (!listaContenedor || !montoTotalSpan || !btnFinalizar) return;
  
  if (carrito.length === 0) {
    listaContenedor.innerHTML = '<p style="color: #aaa; font-size: 13px; text-align: center;">El carrito está vacío.</p>';
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

// 3. Envío consolidado a tu WhatsApp real
const btnFinalizar = document.getElementById('btn-finalizar');
if (btnFinalizar) {
    btnFinalizar.addEventListener('click', () => {
      const nroTelefono = "5491127433172"; 
      
      let pedidoDetalle = "🛒 *NUEVO PEDIDO MAYORISTA*\n\n";
      let totalPedido = 0;
      
      carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalPedido += subtotal;
        pedidoDetalle += `▪️ ${item.nombre}\n  Cant: ${item.cantidad} x $${item.precio.toLocaleString('es-AR')} = $${subtotal.toLocaleString('es-AR')}\n\n`;
      });
      
      pedidoDetalle += `💰 *Total del Pedido: $${totalPedido.toLocaleString('es-AR')}*`;
      
      const urlWhatsApp = `https://whatsapp.com{nroTelefono}&text=${encodeURIComponent(pedidoDetalle)}&type=phone_number&app_absent=0`;
      window.open(urlWhatsApp, '_blank');
    });
}

// 4. Funciones para controlar el cartel de la foto ampliada
function abrirImagenGrande(url) {
    const modal = document.getElementById('mi-modal-imagen');
    const imgAmpliada = document.getElementById('imagen-ampliada');
    
    if (modal && imgAmpliada) {
        imgAmpliada.src = url;
        modal.style.display = 'flex';
    }
}

const modalImagen = document.getElementById('mi-modal-imagen');
if (modalImagen) {
    modalImagen.addEventListener('click', function(e) {
        if (e.target === document.getElementById('imagen-ampliada')) return;
        this.style.display = 'none';
    });
}


