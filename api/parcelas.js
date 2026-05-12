import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  // =====================================
  // CORS
  // =====================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // =====================================
    // DADOS RECEBIDOS
    // =====================================
    const { empresa_id, tabela_nome } = req.query;

    console.log("EMPRESA:", empresa_id);
    console.log("TABELA:", tabela_nome);

    // =====================================
    // VALIDAÇÃO
    // =====================================
    if (!empresa_id || !tabela_nome) {
      return res.status(400).json({
        erro: "Dados incompletos",
      });
    }

    // =====================================
    // BUSCAR MODALIDADES DA TABELA
    // =====================================
    const result = await pool.query(
      `
      SELECT modalidade
      FROM taxas
      WHERE empresa_id = $1
        AND tabela_nome = $2
      `,
      [empresa_id, tabela_nome],
    );

    const modalidades = result.rows.map((item) =>
      item.modalidade?.trim().toLowerCase(),
    );

    console.log("MODALIDADES:", modalidades);

    // =====================================
    // DEFINIR LIMITE REAL
    // =====================================
    let maxParcelas = 12;

    if (modalidades.includes("21x")) {
      maxParcelas = 21;
    } else if (modalidades.includes("18x")) {
      maxParcelas = 18;
    }

    console.log("MAX PARCELAS:", maxParcelas);

    // =====================================
    // RETORNO
    // =====================================
    return res.status(200).json({
      sucesso: true,
      total_registros: modalidades.length,
      max_parcelas: maxParcelas,
    });
  } catch (error) {
    console.error("ERRO API PARCELAS:", error);

    return res.status(500).json({
      erro: "Erro interno",
    });
  }
}
