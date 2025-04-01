// Al cargar la página, verifica si hay token para mostrar la sección de animes y el panel admin
document.addEventListener("DOMContentLoaded", function() {
  verificarLogin();
});

// Función para verificar si hay token y mostrar u ocultar secciones según el rol
function verificarLogin() {
  const token = localStorage.getItem("token");
  const animeContainer = document.getElementById("animeContainer");
  if (token) {
    animeContainer.style.display = "block";
  } else {
    animeContainer.style.display = "none";
  }
  // Verificar si el usuario es admin y mostrar el panel de administración
  verificarAdmin();
}

// Función para detectar etiquetas HTML en un texto
function tieneEtiquetas(texto) {
  return /<[^>]*>?/gm.test(texto);
}

// ============================================
// Registro de usuario
// ============================================
const formRegistro = document.getElementById("formRegistro");
formRegistro.addEventListener("submit", e => {
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
formLogin.addEventListener("submit", e => {
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
btnCerrarSesion.addEventListener("click", () => {
  localStorage.removeItem("token");
  alert("Sesión cerrada.");
  verificarLogin();
});

// ============================================
// Agregar Anime
// ============================================
const formAnime = document.getElementById("formAnime");
formAnime.addEventListener("submit", e => {
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
  
  fetch('/agregarAnime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem("token")
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    if(response.ok){
      alert("Anime agregado correctamente");
      formAnime.reset();
      mostrarAnimes();
    } else {
      alert("Error al agregar anime");
    }
  })
  .catch(err => {
    alert("Error de red o del servidor: " + err);
  });
});

// ============================================
// Mostrar / Ocultar Animes
// ============================================
const btnMostrar = document.getElementById("btnMostrar");
const btnOcultar = document.getElementById("btnOcultar");
const listaAnimes = document.getElementById("listaAnimes");

btnMostrar.addEventListener("click", mostrarAnimes);
btnOcultar.addEventListener("click", () => {
  listaAnimes.style.display = "none";
});

function mostrarAnimes() {
  fetch('/obtenerAnimes', {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem("token")
    }
  })
  .then(res => res.json())
  .then(animes => {
    listaAnimes.innerHTML = '';
    animes.forEach(anime => {
      let li = document.createElement("li");
      li.classList.add("list-group-item");
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
  fetch('/eliminarAnime', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem("token")
    },
    body: JSON.stringify({ id })
  })
  .then(() => { 
    alert("Anime eliminado"); 
    mostrarAnimes(); 
  });
}

// ============================================
// Editar Anime
// ============================================
function editarAnime(id) {
  const campos = ['titulo','estado','plataforma','genero','personaje_favorito','soundtrack','calidad_animacion','calificacion'];
  let animeEditado = { id };

  for (let campo of campos) {
    let valor = prompt(`Nuevo valor para ${campo}:`);
    if (tieneEtiquetas(valor)) {
      alert("No se permiten etiquetas HTML");
      return;
    }
    animeEditado[campo] = valor;
  }

  fetch('/editarAnime', {
    method:'POST', 
    headers:{
      'Content-Type':'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem("token")
    },
    body: JSON.stringify(animeEditado)
  })
  .then(() => { 
    alert("Anime editado"); 
    mostrarAnimes(); 
  });
}

// ============================================
// Lógica de administración
// ============================================

// Función para verificar si el usuario es administrador
function verificarAdmin() {
  const token = localStorage.getItem("token");
  const adminContainer = document.getElementById("adminContainer");
  if (token) {
    try {
      // Decodificar el token usando jwt-decode (asegúrate de incluirlo en el HTML)
      const decoded = jwt_decode(token);
      if (decoded.role && decoded.role === "admin") {
        adminContainer.style.display = "block";
      } else {
        adminContainer.style.display = "none";
      }
    } catch (e) {
      adminContainer.style.display = "none";
    }
  } else {
    adminContainer.style.display = "none";
  }
}

// Manejo del botón para ver usuarios en el panel admin
const btnVerUsuarios = document.getElementById("btnVerUsuarios");
const listaUsuarios = document.getElementById("listaUsuarios");

if(btnVerUsuarios){
  btnVerUsuarios.addEventListener("click", () => {
    fetch('/admin/usuarios', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem("token")
      }
    })
    .then(res => res.json())
    .then(usuarios => {
      listaUsuarios.innerHTML = '';
      usuarios.forEach(usuario => {
        let li = document.createElement("li");
        li.classList.add("list-group-item");
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

// Función para eliminar un usuario (solo admin)
function eliminarUsuario(id) {
  if (confirm("¿Seguro que deseas eliminar este usuario?")) {
    fetch('/admin/eliminarUsuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem("token")
      },
      body: JSON.stringify({ id })
    })
    .then(() => {
      alert("Usuario eliminado");
      btnVerUsuarios.click(); // Actualiza la lista
    })
    .catch(err => alert("Error al eliminar usuario: " + err));
  }
}