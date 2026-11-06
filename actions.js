const $ = id => document.getElementById(id);
const T = {
 es:{title:"Loan Simulator",sub:"Calcula tu cuota mensual y consulta cuánto pagas de capital e intereses en cada periodo.",
  datos:"Datos del préstamo",monto:"Monto del préstamo",tasa:"Tasa de interés (%)",tipo:"Tipo de tasa",
  anual:"Efectiva anual",mensual:"Efectiva mensual",plazo:"Plazo (meses)",
  phMonto:"Ej: 10000000",phTasa:"Ej: 12",phPlazo:"Ej: 36",calcular:"Calcular préstamo",limpiar:"Limpiar datos",
  vacioT:"Tu simulación aparecerá aquí",vacioP:"Completa los datos y pulsa “Calcular préstamo”.",
  enInt:"en intereses",cuotaFija:"Cuota mensual fija",capital:"Capital",intereses:"Intereses",
  tem:"Tasa efectiva mensual",totInt:"Total intereses",totPag:"Total a pagar",tabla:"Tabla de amortización",
  pdf:"Exportar PDF",print:"Imprimir",thP:"Periodo",thC:"Cuota",thI:"Interés",thS:"Saldo",
  eMonto:"Ingresa un monto mayor que 0.",eTasa:"Ingresa una tasa igual o mayor que 0.",ePlazo:"El plazo debe estar entre 1 y 600 meses.",
  ea:"E.A.",em:"E.M.",meses:"meses",pdfTitle:"Loan Simulator - Tabla de amortización",
  pdfD:"Monto: {m}   Tasa: {t}% {k}   Plazo: {n} meses",kA:"efectiva anual",kM:"efectiva mensual",
  pdfR:"Tasa efectiva mensual: {i}%   Cuota: {c}   Total intereses: {ti}   Total a pagar: {tp}",
  pdfNoLib:"No se pudo cargar la librería de PDF. Se abrirá la impresión: elige “Guardar como PDF”.",file:"amortizacion-prestamo.pdf",
  total:"Total",pdfSub:"Simulación de préstamo - Sistema francés (cuota fija)",pageOf:"Página {p} de {n}",generado:"Generado el {d}",
  noData:"Primero calcula un préstamo.",pdfBusy:"Generando PDF…",pdfOk:"PDF descargado correctamente",pdfErr:"No se pudo crear el PDF. Intenta de nuevo.",
  printing:"Abriendo vista de impresión…",ttPdf:"Descargar la simulación en un archivo PDF",ttPrint:"Imprimir la simulación"},
 en:{title:"Loan Simulator",sub:"Calculate your monthly payment and see how much goes to principal and interest in each period.",
  datos:"Loan details",monto:"Loan amount",tasa:"Interest rate (%)",tipo:"Rate type",
  anual:"Effective annual",mensual:"Effective monthly",plazo:"Term (months)",
  phMonto:"E.g. 10000000",phTasa:"E.g. 12",phPlazo:"E.g. 36",calcular:"Calculate loan",limpiar:"Clear data",
  vacioT:"Your simulation will appear here",vacioP:"Fill in the details and press “Calculate loan”.",
  enInt:"in interest",cuotaFija:"Fixed monthly payment",capital:"Principal",intereses:"Interest",
  tem:"Effective monthly rate",totInt:"Total interest",totPag:"Total to pay",tabla:"Amortization schedule",
  pdf:"Export PDF",print:"Print",thP:"Period",thC:"Payment",thI:"Interest",thS:"Balance",
  eMonto:"Enter an amount greater than 0.",eTasa:"Enter a rate equal to or greater than 0.",ePlazo:"The term must be between 1 and 600 months.",
  ea:"E.A.R.",em:"E.M.R.",meses:"months",pdfTitle:"Loan Simulator - Amortization schedule",
  pdfD:"Amount: {m}   Rate: {t}% {k}   Term: {n} months",kA:"effective annual",kM:"effective monthly",
  pdfR:"Effective monthly rate: {i}%   Payment: {c}   Total interest: {ti}   Total to pay: {tp}",
  pdfNoLib:"The PDF library could not be loaded. Print will open: choose “Save as PDF”.",file:"loan-amortization.pdf",
  total:"Total",pdfSub:"Loan simulation - French system (fixed payment)",pageOf:"Page {p} of {n}",generado:"Generated on {d}",
  noData:"Calculate a loan first.",pdfBusy:"Creating PDF…",pdfOk:"PDF downloaded successfully",pdfErr:"The PDF could not be created. Please try again.",
  printing:"Opening print preview…",ttPdf:"Download the simulation as a PDF file",ttPrint:"Print the simulation"}
};
const LOC = {es:"es-CO", en:"en-US"};
let lang = "es", errKey = "";
try { lang = localStorage.getItem("lang") || ""; } catch(e){}
if(!T[lang]) lang = (navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es";

const t = (k, v) => (T[lang][k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x]);
const money = n => n.toLocaleString(LOC[lang], {style:"currency", currency:"COP", maximumFractionDigits:2});
const num2  = n => n.toLocaleString(LOC[lang], {minimumFractionDigits:2, maximumFractionDigits:2});
const setErr = k => { errKey = k; $("error").textContent = k ? t(k) : ""; };

function applyLang(){
  document.documentElement.lang = lang;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
  document.querySelectorAll("[data-tt]").forEach(e => e.title = t(e.dataset.tt));
  document.querySelectorAll("[data-ph]").forEach(e => e.placeholder = t(e.dataset.ph));
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  setErr(errKey);
  if(datos) mostrar();           // vuelve a dibujar resultados con el nuevo formato
}
function setLang(l){
  lang = l;
  try { localStorage.setItem("lang", l); } catch(e){}
  applyLang();
}
document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
let datos = null; // última simulación

$("form").addEventListener("submit", e => { e.preventDefault(); calcular(); });
$("btnLimpiar").addEventListener("click", () => {
  $("form").reset(); ["monto","tasa","plazo"].forEach(i => $(i).value = "");
  setErr(""); $("resultado").classList.add("hidden"); $("vacio").classList.remove("hidden"); datos = null;
});
$("btnPrint").addEventListener("click", imprimir);
$("btnPdf").addEventListener("click", exportarPDF);

function calcular(){
  const monto = parseFloat($("monto").value);
  const tasa  = parseFloat($("tasa").value);
  const plazo = parseInt($("plazo").value, 10);
  const tipo  = document.querySelector('input[name="tipo"]:checked').value;
  setErr("");

  if(!(monto > 0)) return setErr("eMonto");
  if(!(tasa >= 0)) return setErr("eTasa");
  if(!(plazo >= 1 && plazo <= 600)) return setErr("ePlazo");

  // Tasa efectiva mensual
  let i = tasa / 100;
  if(tipo === "anual") i = Math.pow(1 + i, 1/12) - 1;

  // Cuota fija (sistema francés)
  const cuota = i === 0 ? monto / plazo : monto * i / (1 - Math.pow(1 + i, -plazo));

  const filas = []; let saldo = monto, totInt = 0;
  for(let p = 1; p <= plazo; p++){
    const interes = saldo * i;
    const capital = cuota - interes;
    saldo = p === plazo ? 0 : saldo - capital;
    totInt += interes;
    filas.push({p, cuota, interes, capital, saldo});
  }
  datos = {monto, tasa, tipo, plazo, i, cuota, totInt, filas};
  mostrar();
}

function mostrar(){
  const d = datos, total = d.monto + d.totInt, pct = total ? d.totInt / total * 100 : 0;
  $("vacio").classList.add("hidden"); $("resultado").classList.remove("hidden");
  $("cuota").textContent = money(d.cuota);
  $("rTem").textContent = (d.i * 100).toFixed(4) + " %";
  $("rInt").textContent = money(d.totInt);
  $("rTot").textContent = money(total);
  $("pctInt").textContent = pct.toFixed(1) + "%";
  $("donut").style.background = `conic-gradient(var(--interest) 0 ${pct}%, var(--capital) ${pct}% 100%)`;
  $("pdatos").textContent = `${money(d.monto)} · ${d.tasa}% ${d.tipo === "anual" ? t("ea") : t("em")} · ${d.plazo} ${t("meses")}`;
  $("cuerpo").innerHTML = d.filas.map(f => `<tr>
    <td>${f.p}</td><td>${num2(f.cuota)}</td><td class="i">${num2(f.interes)}</td>
    <td class="c">${num2(f.capital)}</td><td>${num2(f.saldo)}</td></tr>`).join("");
}

let tId, tituloOriginal = "";
function toast(m){
  const e = $("toast"); e.textContent = m; e.classList.add("show");
  clearTimeout(tId); tId = setTimeout(() => e.classList.remove("show"), 2800);
}
const fechaTxt = () => new Date().toLocaleString(LOC[lang], {dateStyle:"long", timeStyle:"short"});

/* ---------- IMPRIMIR ---------- */
function imprimir(){
  if(!datos) return toast(t("noData"));
  toast(t("printing"));
  setTimeout(() => window.print(), 250);
}
// Se ejecuta también con Ctrl+P / menú del navegador
window.addEventListener("beforeprint", () => {
  tituloOriginal = document.title;
  $("pfecha").textContent = t("generado", {d: fechaTxt()});
  if(datos) document.title = "Loan Simulator - " + num2(datos.monto) + " - " + datos.plazo + " " + t("meses");
});
window.addEventListener("afterprint", () => { if(tituloOriginal) document.title = tituloOriginal; });

/* ---------- EXPORTAR PDF ---------- */
function exportarPDF(){
  if(!datos) return toast(t("noData"));
  if(!window.jspdf){ alert(t("pdfNoLib")); return imprimir(); }
  const btn = $("btnPdf"), lbl = btn.querySelector("span");
  btn.disabled = true; lbl.textContent = t("pdfBusy");
  setTimeout(() => {                       // deja pintar el estado "cargando"
    try { crearPDF(); toast(t("pdfOk")); }
    catch(e){ console.error(e); toast(t("pdfErr")); }
    btn.disabled = false; lbl.textContent = t("pdf");
  }, 80);
}

function crearPDF(){
  const d = datos, doc = new window.jspdf.jsPDF({unit:"mm", format:"a4"});
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const ink=[16,36,58], teal=[14,159,138], amber=[185,117,26], mute=[94,113,134];

  // Banda de título
  doc.setFillColor(...ink); doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.text("Loan Simulator", 14, 14);
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text(t("pdfSub"), 14, 22); doc.text(fechaTxt(), W-14, 22, {align:"right"});

  // Datos de entrada
  doc.setTextColor(...ink); doc.setFontSize(10);
  doc.text(t("pdfD", {m:num2(d.monto), t:d.tasa, k:t(d.tipo === "anual" ? "kA" : "kM"), n:d.plazo}), 14, 40);

  // Tarjetas de resumen
  const cards = [
    [t("cuotaFija"), num2(d.cuota)],
    [t("tem"), (d.i*100).toFixed(4) + " %"],
    [t("totInt"), num2(d.totInt)],
    [t("totPag"), num2(d.monto + d.totInt)]
  ];
  const cw = (W - 28 - 9) / 4;
  cards.forEach((c, k) => {
    const x = 14 + k * (cw + 3);
    doc.setFillColor(243,246,250); doc.roundedRect(x, 46, cw, 19, 2, 2, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...mute); doc.text(c[0], x+3, 52);
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...ink); doc.text(c[1], x+3, 60);
  });

  // Tabla de amortización
  doc.autoTable({
    startY: 72,
    margin: {top: 14, left: 14, right: 14, bottom: 18},
    head: [[t("thP"), t("thC"), t("thI"), t("capital"), t("thS")]],
    body: d.filas.map(f => [f.p, num2(f.cuota), num2(f.interes), num2(f.capital), num2(f.saldo)]),
    foot: [[t("total"), num2(d.cuota * d.plazo), num2(d.totInt), num2(d.monto), ""]],
    showFoot: "lastPage",
    styles: {halign:"right", fontSize:9, cellPadding:2.2, textColor:ink},
    headStyles: {fillColor:ink, textColor:255, fontStyle:"bold"},
    footStyles: {fillColor:[225,232,240], textColor:ink, fontStyle:"bold"},
    alternateRowStyles: {fillColor:[248,250,252]},
    columnStyles: {0:{halign:"center"}, 2:{textColor:amber}, 3:{textColor:teal}}
  });

  // Pie de página con numeración
  const n = doc.getNumberOfPages();
  for(let p = 1; p <= n; p++){
    doc.setPage(p); doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...mute);
    doc.setDrawColor(221,229,238); doc.line(14, H-13, W-14, H-13);
    doc.text("Loan Simulator", 14, H-8); doc.text(t("pageOf", {p, n}), W-14, H-8, {align:"right"});
  }
  doc.save(t("file"));
}

applyLang(); // idioma inicial (guardado o del navegador)
