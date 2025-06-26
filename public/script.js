// Al cargar la página, verifica si hay token y muestra/oculta secciones según corresponda
document.addEventListener("DOMContentLoaded", function() {
  verificarLogin();
});

// Función que verifica la sesión y muestra u oculta secciones
function verificarLogin() {
  const token = localStorage.getItem("token");
  const animeContainer = document.getElementById("animeContainer");
  const loginContainer = document.getElementById("loginContainer");
  const registerContainer = document.getElementById("registerContainer");
  const logoutContainer = document.getElementById("logoutContainer");

  if (token) {
    animeContainer.style.display = "block";
    logoutContainer.style.display = "block";
    loginContainer.style.display = "none";
    registerContainer.style.display = "none";
    // Hace visible el contenedor de documentos para usuarios logueados.
    document.getElementById("documentosContainer").style.display = "block";
    // Llama a la función para que busque y muestre la lista de documentos.
    cargarDocumentos();
  } else {
    animeContainer.style.display = "none";
    logoutContainer.style.display = "none";
    loginContainer.style.display = "block";
    registerContainer.style.display = "block";
  }
  verificarAdmin();
}

// Función para decodificar token y verificar si el usuario es admin
function verificarAdmin() {
  const token = localStorage.getItem("token");
  const adminContainer = document.getElementById("adminContainer");
  if (token) {
    try {
      const decoded = jwt_decode(token);
      console.log("Token decodificado:", decoded);
      if (decoded.role && decoded.role === "admin") {
        adminContainer.style.display = "block";
        // Hace visible el formulario de subida, pero solo para los administradores.
        document.getElementById("formUpload").style.display = "block";
      } else {
        adminContainer.style.display = "none";
      }
    } catch (e) {
      console.error("Error al decodificar token:", e);
      adminContainer.style.display = "none";
    }
  } else {
    adminContainer.style.display = "none";
  }
}

// Función para detectar etiquetas HTML
function tieneEtiquetas(texto) {
  return /<[^>]*>?/gm.test(texto);
}

// ============================================
// Registro de usuario
// ============================================
const formRegistro = document.getElementById("formRegistro");
formRegistro.addEventListener("submit", function(e) {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formRegistro));
  for (let key in datos) {
    if (tieneEtiquetas(datos[key])) {
      alert("No se permiten etiquetas HTML.");
      return;
    }
  }
  fetch("/registro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
  .then(res => {
    if (!res.ok) throw new Error("Error al registrarse");
    alert("Registro exitoso. Ahora puedes iniciar sesión.");
    formRegistro.reset();
  })
  .catch(err => alert("Error: " + err.message));
});

// ============================================
// Login de usuario
// ============================================
const formLogin = document.getElementById("formLogin");
formLogin.addEventListener("submit", function(e) {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formLogin));
  for (let key in datos) {
    if (tieneEtiquetas(datos[key])) {
      alert("No se permiten etiquetas HTML.");
      return;
    }
  }
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
  .then(res => {
    if (!res.ok) throw new Error("Credenciales incorrectas");
    return res.json();
  })
  .then(data => {
    localStorage.setItem("token", data.token);
    alert("Inicio de sesión exitoso");
    verificarLogin();
  })
  .catch(err => alert("Error: " + err.message));
});

// ============================================
// Cerrar sesión
// ============================================
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
btnCerrarSesion.addEventListener("click", function() {
  localStorage.removeItem("token");
  alert("Sesión cerrada.");
  verificarLogin();
});

// ============================================
// Agregar Anime
// ============================================
const formAnime = document.getElementById("formAnime");
formAnime.addEventListener("submit", function(e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(formAnime));
  if (parseFloat(formData.calificacion) < 0 || parseFloat(formData.calificacion) > 10) {
    alert("La calificación debe estar entre 0 y 10.");
    return;
  }
  for (let key in formData) {
    if (tieneEtiquetas(formData[key])) {
      alert("No se permiten etiquetas HTML");
      return;
    }
  }
  fetch("/agregarAnime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    if (response.ok) {
      alert("Anime agregado correctamente");
      formAnime.reset();
      mostrarAnimes();
    } else {
      alert("Error al agregar anime");
    }
  })
  .catch(err => alert("Error de red o del servidor: " + err));
});

// ============================================
// Mostrar / Ocultar Animes
// ============================================
const btnMostrar = document.getElementById("btnMostrar");
const btnOcultar = document.getElementById("btnOcultar");
const listaAnimes = document.getElementById("listaAnimes");

btnMostrar.addEventListener("click", mostrarAnimes);
btnOcultar.addEventListener("click", function() {
  listaAnimes.style.display = "none";
});

function mostrarAnimes() {
  fetch("/obtenerAnimes", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("token")
    }
  })
  .then(res => res.json())
  .then(animes => {
    listaAnimes.innerHTML = "";
    animes.forEach(anime => {
      let li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `
        <div>
          ${anime.titulo} (${anime.estado}) - ${anime.plataforma}
          <br>Género: ${anime.genero}, Personaje: ${anime.personaje_favorito}
          <br>Soundtrack: ${anime.soundtrack}, Animación: ${anime.calidad_animacion}, Calificación: ${anime.calificacion}
        </div>
        <div class="btn-container">
          <button class="btn btn-warning btn-sm mx-2" onclick="editarAnime(${anime.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarAnime(${anime.id})">Eliminar</button>
        </div>
      `;
      listaAnimes.appendChild(li);
    });
    listaAnimes.style.display = "block";
  });
}

// ============================================
// Eliminar Anime
// ============================================
function eliminarAnime(id) {
  fetch("/eliminarAnime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ id })
  })
  .then(response => {
    if (response.ok) {
      alert("Anime eliminado");
      mostrarAnimes();
    } else {
      alert("Error al eliminar anime");
    }
  });
}

// ============================================
// Editar Anime
// ============================================
function editarAnime(id) {
  const campos = ["titulo", "estado", "plataforma", "genero", "personaje_favorito", "soundtrack", "calidad_animacion", "calificacion"];
  let animeEditado = { id };
  // Mensaje actualizado: "Nuevo [campo]:"
  for (let campo of campos) {
    let valor = prompt(`Nuevo ${campo}:`);
    if (tieneEtiquetas(valor)) {
      alert("No se permiten etiquetas HTML");
      return;
    }
    animeEditado[campo] = valor;
  }
  fetch("/editarAnime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify(animeEditado)
  })
  .then(() => {
    alert("Anime editado");
    mostrarAnimes();
  });
}

// ============================================
// Lógica de Administración
// ============================================
const btnVerUsuarios = document.getElementById("btnVerUsuarios");
const btnOcultarUsuarios = document.getElementById("btnOcultarUsuarios");
const listaUsuarios = document.getElementById("listaUsuarios");

if (btnVerUsuarios) {
  btnVerUsuarios.addEventListener("click", function() {
    fetch("/admin/usuarios", {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    })
    .then(res => res.json())
    .then(usuarios => {
      listaUsuarios.innerHTML = "";
      usuarios.forEach(usuario => {
        let li = document.createElement("li");
        li.className = "list-group-item";
        li.innerHTML = `
          <div>
            ID: ${usuario.id} - Usuario: ${usuario.username} - Rol: ${usuario.role} - Creado: ${usuario.created_at}
          </div>
          <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${usuario.id})">Eliminar Usuario</button>
        `;
        listaUsuarios.appendChild(li);
      });
      listaUsuarios.style.display = "block";
    })
    .catch(err => alert("Error al cargar usuarios: " + err));
  });
}

if (btnOcultarUsuarios) {
  btnOcultarUsuarios.addEventListener("click", function() {
    listaUsuarios.style.display = "none";
  });
}

// Función para eliminar un usuario (solo admin)
function eliminarUsuario(id) {
  if (confirm("¿Seguro que deseas eliminar este usuario?")) {
    fetch("/admin/eliminarUsuario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({ id })
    })
    .then(response => {
      if (response.ok) {
        alert("Usuario eliminado");
        // Actualiza la lista de usuarios
        if (btnVerUsuarios) btnVerUsuarios.click();
      } else {
        alert("Error al eliminar usuario");
      }
    })
    .catch(err => alert("Error al eliminar usuario: " + err));
  }
}

// ============================================
// Lógica para Documentos Firmados con DSA
// ============================================

// Pide al backend la lista de documentos y los muestra en la página.
function cargarDocumentos() {
    const listaDocumentos = document.getElementById("listaDocumentos");
    fetch("/documentos")
        .then(res => res.json())
        .then(documentos => {
            listaDocumentos.innerHTML = "";
            documentos.forEach(doc => {
                let li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    <span>${doc.nombre_archivo}</span>
                    <div>
                        <a href="/documentos/${doc.id}/descargar" class="btn btn-primary btn-sm">Descargar</a>
                        <button class="btn btn-success btn-sm mx-2" onclick="verificarDocumento(${doc.id})">Verificar Integridad</button>
                        <span id="status-${doc.id}" style="width: 110px; display: inline-block;"></span>
                    </div>
                `;
                listaDocumentos.appendChild(li);
            });
        });
}

// --- FUNCIONES AUXILIARES NECESARIAS PARA JSRSASSIGN ---

// Convierte un ArrayBuffer (como los datos de un archivo) a una cadena hexadecimal.
function arrayBufferToHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

// Convierte una cadena Base64 a una cadena hexadecimal.
function base64ToHex(str) {
    const raw = window.atob(str);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
        const hex = raw.charCodeAt(i).toString(16);
        result += (hex.length === 2 ? hex : '0' + hex);
    }
    return result;
}


// --- TU FUNCIÓN PRINCIPAL, AHORA USANDO JSRSASSIGN ---

// Orquesta todo el proceso de verificación en el navegador del cliente.
async function verificarDocumento(docId) {
    const statusSpan = document.getElementById(`status-${docId}`);
    statusSpan.textContent = "Verificando...";
    try {
        // 1. Pide al servidor la clave pública. No cambia nada aquí.
        const pubKeyResponse = await fetch('/clave-publica');
        const pubKeyPEM = await pubKeyResponse.text();
        
        // YA NO ES NECESARIO: La llamada a importarClavePublica se elimina,
        // jsrsasign trabaja directamente con el texto PEM.
        // const publicKey = await importarClavePublica(pubKeyPEM);

        // 2. Pide al servidor la firma digital.
        const firmaResponse = await fetch(`/documentos/${docId}/firma`);
        const { firma } = await firmaResponse.json(); // firma está en Base64

        // CAMBIO: Convierte la firma de Base64 a Hexadecimal para jsrsasign.
        const signatureHex = base64ToHex(firma);

        // 3. Descarga el contenido del archivo como un ArrayBuffer. No cambia nada aquí.
        const archivoResponse = await fetch(`/documentos/${docId}/descargar`);
        const archivoData = await archivoResponse.arrayBuffer();

        // CAMBIO: Convierte los datos del archivo a Hexadecimal.
        const archivoDataHex = arrayBufferToHex(archivoData);

        // 4. El corazón de la verificación, AHORA con jsrsasign.
        // Se reemplaza window.crypto.subtle.verify
        
        // a) Crea un nuevo objeto de firma, especificando el algoritmo.
        //    Como tu hash es SHA-256 y el algoritmo es DSA, el nombre es "SHA256withDSA".
        const sig = new KJUR.crypto.Signature({ "alg": "SHA256withDSA" });

        // b) Inicializa el objeto con la clave pública en formato PEM.
        sig.init(pubKeyPEM);

        // c) Carga los datos del documento (en hexadecimal) para verificar.
        sig.updateHex(archivoDataHex);

        // d) Verifica la firma (en hexadecimal) contra los datos cargados.
        const esValido = sig.verify(signatureHex);

        // 5. El resto del código para mostrar el estado no cambia.
        if (esValido) {
            statusSpan.textContent = "✅ ¡Verificado!";
            statusSpan.style.color = "lightgreen";
        } else {
            statusSpan.textContent = "❌ ¡Firma Inválida!";
            statusSpan.style.color = "red";
        }
    } catch (error) {
        console.error("Error durante la verificación:", error);
        statusSpan.textContent = "Error";
    }
}

// Función auxiliar para decodificar la firma (texto Base64) a los bytes crudos (ArrayBuffer).
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Añade el evento de "submit" al formulario de subida de archivos del admin.
const formUpload = document.getElementById("formUpload");
if (formUpload) {
    formUpload.addEventListener("submit", function(e) {
        e.preventDefault();
        const formData = new FormData(formUpload);
        const token = localStorage.getItem("token");
        fetch("/admin/upload-documento", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error("Error al subir el archivo.");
            return res.json();
        })
        .then(data => {
            alert(data.message);
            formUpload.reset();
            cargarDocumentos(); // Recarga la lista de documentos después de subir uno nuevo.
        })
        .catch(err => alert(err.message));
    });
}