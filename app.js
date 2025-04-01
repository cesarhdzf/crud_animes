require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const app = express();

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SECRET = process.env.JWT_SECRET || "clave-super-secreta";

// Conexión a PostgreSQL (Neon.tech)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware para autenticar mediante JWT
function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ===================================================
// Registro de usuario
// ===================================================
app.post(
  "/registro",
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("El usuario debe tener entre 3 y 50 caracteres.")
      .trim()
      .escape(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres.")
      .trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let { username, password } = req.body;
    try {
      // Cifrado de la contraseña con hash
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        "INSERT INTO usuarios (username, password_hash) VALUES ($1, $2)",
        [username, hash]
      );
      res.sendStatus(201);
    } catch (err) {
      // Error por usuario duplicado (violación UNIQUE)
      if (err.code === "23505") {
        return res.status(400).send("El nombre de usuario ya está en uso.");
      }
      console.error(err);
      res.status(500).send("Error en registro.");
    }
  }
);

// ===================================================
// Login de usuario
// ===================================================
app.post(
  "/login",
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("El usuario debe tener al menos 3 caracteres.")
      .trim()
      .escape(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres.")
      .trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let { username, password } = req.body;
    try {
      const result = await pool.query(
        "SELECT * FROM usuarios WHERE username = $1",
        [username]
      );
      if (result.rowCount === 0) {
        return res.status(401).send("Usuario no encontrado.");
      }
      const user = result.rows[0];
      const valido = await bcrypt.compare(password, user.password_hash);
      if (!valido) {
        return res.status(401).send("Contraseña incorrecta.");
      }
      // Genera token JWT con id y username
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "2h" });
      res.json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error en login.");
    }
  }
);

// ===================================================
// CRUD de animes (rutas protegidas)
// ===================================================

// Agregar Anime
app.post(
  "/agregarAnime",
  autenticarToken,
  [
    body("titulo").trim().escape().notEmpty().withMessage("Título es requerido."),
    body("estado").trim().escape().notEmpty().withMessage("Estado es requerido."),
    body("plataforma").trim().escape().notEmpty().withMessage("Plataforma es requerida."),
    body("genero").trim().escape().notEmpty().withMessage("Género es requerido."),
    body("personaje_favorito").trim().escape().notEmpty().withMessage("Personaje Favorito es requerido."),
    body("soundtrack").trim().escape().notEmpty().withMessage("Soundtrack es requerido."),
    body("calidad_animacion").trim().escape().notEmpty().withMessage("Calidad de animación es requerida."),
    body("calificacion")
      .isFloat({ min: 0, max: 10 })
      .withMessage("La calificación debe estar entre 0 y 10.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let { titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;
    try {
      // Inserta el anime asociándolo al usuario autenticado (req.user.id)
      await pool.query(
        `INSERT INTO animes (titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, req.user.id]
      );
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error en base de datos");
    }
  }
);

// Obtener animes del usuario autenticado
app.get("/obtenerAnimes", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM animes WHERE user_id = $1", [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener animes");
  }
});

// Eliminar Anime (solo si pertenece al usuario)
app.post("/eliminarAnime", autenticarToken, async (req, res) => {
  const { id } = req.body;
  try {
    // Verifica que el anime pertenezca al usuario
    const result = await pool.query("SELECT * FROM animes WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(403).send("No autorizado para eliminar este anime");
    }
    await pool.query("DELETE FROM animes WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar");
  }
});

// Editar Anime (solo si pertenece al usuario)
app.post(
  "/editarAnime",
  autenticarToken,
  [
    body("titulo").trim().escape().notEmpty().withMessage("Título es requerido."),
    body("estado").trim().escape().notEmpty().withMessage("Estado es requerido."),
    body("plataforma").trim().escape().notEmpty().withMessage("Plataforma es requerida."),
    body("genero").trim().escape().notEmpty().withMessage("Género es requerido."),
    body("personaje_favorito").trim().escape().notEmpty().withMessage("Personaje Favorito es requerido."),
    body("soundtrack").trim().escape().notEmpty().withMessage("Soundtrack es requerido."),
    body("calidad_animacion").trim().escape().notEmpty().withMessage("Calidad de animación es requerida."),
    body("calificacion")
      .isFloat({ min: 0, max: 10 })
      .withMessage("La calificación debe estar entre 0 y 10.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let { id, titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;
    try {
      // Verifica que el anime pertenezca al usuario
      const result = await pool.query("SELECT * FROM animes WHERE id = $1 AND user_id = $2", [id, req.user.id]);
      if (result.rowCount === 0) {
        return res.status(403).send("No autorizado para editar este anime");
      }
      await pool.query(
        `UPDATE animes SET titulo=$1, estado=$2, plataforma=$3, genero=$4, personaje_favorito=$5,
         soundtrack=$6, calidad_animacion=$7, calificacion=$8 WHERE id=$9`,
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, id]
      );
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error al editar anime");
    }
  }
);

// ===================================================
// Iniciar el servidor
// ===================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));