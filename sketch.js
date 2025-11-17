let volcanoData;
let worldImg;

let activeType = null;
let typeColors = {};
let volcanoTypes = [];

let hoveredVolcano = null;
let imageLoaded = false;

function preload() {
  volcanoData = loadTable("volcanoes.csv", "csv", "header");

  worldImg = loadImage(
    "worldMap2.png",
    () => { imageLoaded = true; },
    () => {
      console.error("Errore nel caricamento dell'immagine worldMap2.png");
      imageLoaded = false;
    }
  );
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");
  textAlign(LEFT, CENTER);
  noStroke();

  let typeSet = new Set(volcanoData.getColumn("Type"));
  volcanoTypes = Array.from(typeSet).sort();
  assignTypeColors();

  createDropdown();
}



function draw() {
  background("#EEE9DF");

  drawTitle();
  drawLegendBox();

  //misure e posizione mappa
  let mapMargin = 20;
  let mapY = 130;
  let maxMapW = width - 2 * mapMargin;
  let maxMapH = height - mapY - mapMargin;

  let mapW, mapH, mapX;

  if (imageLoaded && worldImg.width > 0) {
    let scaleFactor = min(
      maxMapW / worldImg.width,
      maxMapH / worldImg.height
    );
    mapW = worldImg.width * scaleFactor;
    mapH = worldImg.height * scaleFactor;
  } else {
    mapW = maxMapW;
    mapH = mapW / 2;
    if (mapH > maxMapH) {
      mapH = maxMapH;
      mapW = mapH * 2;
    }
  }
  
  mapX = (width - mapW) / 2 - 40;

  drawWorldMap(mapX, mapY, mapW, mapH);
  drawVolcanoes(mapX, mapY, mapW, mapH);
}

//funzione di info ad hover
function mousePressed() {
  if (hoveredVolcano) {
    let name = hoveredVolcano.name;
    let safeName = encodeURIComponent(name);
    window.location.href = `det.html?name=${safeName}`;
  }
}


//
//  TITLE
//
function drawTitle() {
  push();
  textFont("Helvetica");
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(148);
  fill("#1B2632");
  text("MAPPA DEI VULCANI", width / 2.03, 60);
  pop();
}


//
// WORLD MAP 
//
function drawWorldMap(mapX, mapY, mapW, mapH) {
  push();

  if (imageLoaded && worldImg.width > 0) {
    imageMode(CORNER);
    image(worldImg, mapX, mapY, mapW, mapH);
  } else {
    
    for (let i = 0; i <= 12; i++) {
      let x = mapX + (mapW / 12) * i;
      line(x, mapY, x, mapY + mapH);
    }

    for (let i = 0; i <= 6; i++) {
      let y = mapY + (mapH / 6) * i;
      line(mapX, y, mapX + mapW, y);
    }

    fill(50);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    text("Mappa non caricata", mapX + mapW / 2, mapY + mapH / 2);
  }

  pop();
}


//
// VULCANI 
//
function drawVolcanoes(mapX, mapY, mapW, mapH) {
  hoveredVolcano = null;
  let closestDist = Infinity;

  // Primo ciclo per identificare il vulcano sotto il mouse
  for (let r = 0; r < volcanoData.getRowCount(); r++) {
    let row = volcanoData.getRow(r);
    let lat = float(row.get("Latitude"));
    let lon = float(row.get("Longitude"));
    let type = row.get("Type");
    let elev = float(row.get("Elevation (m)"));
    let name = row.get("Volcano Name") || "Unknown";

    if (activeType && type !== activeType) continue;

    let x = map(lon, -180, 180, mapX, mapX + mapW);
    let y = map(lat, 90, -90, mapY, mapY + mapH);

    let size = 8; 

    let d = dist(mouseX, mouseY, x, y);
    if (d < size + 4 && d < closestDist) {
      closestDist = d;
      hoveredVolcano = { name, type, elev, x, y, size };
    }
  }

  push();

  // Secondo ciclo per disegnare i punti
  for (let r = 0; r < volcanoData.getRowCount(); r++) {
    let row = volcanoData.getRow(r);
    let lat = float(row.get("Latitude"));
    let lon = float(row.get("Longitude"));
    let type = row.get("Type");
    let elev = float(row.get("Elevation (m)"));
    let name = row.get("Volcano Name") || "Unknown";

    if (activeType && type !== activeType) continue;

    let x = map(lon, -180, 180, mapX, mapX + mapW);
    let y = map(lat, 90, -90, mapY, mapY + mapH);

    let size = 8;

    let c = typeColors[type] || color(255, 100, 0);

    noStroke();
    fill(red(c), green(c), blue(c), 200);
    rect(x, y, size, size);

    if (hoveredVolcano && hoveredVolcano.name === name) {
      stroke("#1B2632");
      strokeWeight(2);
      noFill();
      ellipse(x, y, size + 6, size + 6);

      fill(c);
      noStroke();
      ellipse(x, y, size, size);
    }
  }

  pop();

  if (hoveredVolcano) drawTooltip(hoveredVolcano);
}


//
// TOOLTIP 
//
function drawTooltip(volcano) {
  push();
  textFont("Helvetica");
  textSize(12);
  let padding = 8;

  let txtLines = [
    `${volcano.name}`,
    `${volcano.type}`,
    `${nf(volcano.elev, 0, 0)} m`,
  ];

  textAlign(LEFT, TOP);
  let tw = 0;
  for (let t of txtLines) tw = max(tw, textWidth(t));
  tw += padding * 2;
  let th = txtLines.length * 16 + padding * 2;

  let tx = volcano.x + 12;
  let ty = volcano.y - th - 12;

  if (tx + tw > width - 8) tx = volcano.x - tw - 12;
  if (ty < 8) ty = volcano.y + 12;

  fill("#C9C1B1");
  stroke("#1B2632");
  rect(tx, ty, tw, th, 6);

  fill(20);
  noStroke();
  for (let i = 0; i < txtLines.length; i++) {
    text(txtLines[i], tx + padding, ty + padding + i * 16);
  }

  stroke("#1B2632");
  line(tx + tw / 2, ty + th, volcano.x, volcano.y);
  pop();
}


//
// LEGEND BOX
//
function drawLegendBox() {
  let boxW = 240;
  let boxH = 80;  
  let boxX = width - boxW - 30;
  let boxY = 130;

  push();
  fill("#d6cdbcff");
  noStroke();
  rect(boxX, boxY, boxW, boxH, 3);

  fill("#1B2632");
  textSize(14);
  textAlign(LEFT, TOP);
  text("Filtra per tipologia di vulcano", boxX + 10, boxY + 10);
  pop();

  // aggiornamento dropdown
  if (typeof volcanoDropdownDiv !== "undefined") {
    volcanoDropdownDiv.position(boxX + 10, boxY + 40);
    volcanoDropdownList.position(boxX + 10, boxY + 72);
  }
}

//
// DROPDOWN 
//
function createDropdown() {
  //tasto ALL
  volcanoDropdownDiv = createDiv("All ▾");
  volcanoDropdownDiv.style("padding", "6px 10px");
  volcanoDropdownDiv.style("background-color", "#e6e1d8ff");
  volcanoDropdownDiv.style("font-family", "Helvetica, sans-serif");
  volcanoDropdownDiv.style("font-size", "14px");
  volcanoDropdownDiv.style("cursor", "pointer");
  volcanoDropdownDiv.style("border-radius", "3px");
  volcanoDropdownDiv.style("position", "absolute");

  //rettangolo con opzioni
  volcanoDropdownList = createDiv("");
  volcanoDropdownList.style("width", "220px");
  volcanoDropdownList.style("max-height", "300px");
  volcanoDropdownList.style("overflow-y", "auto");
  volcanoDropdownList.style("background-color", "#e6e1d8ff");
  volcanoDropdownList.style("border-radius", "3px");
  volcanoDropdownList.style("display", "none");
  volcanoDropdownList.style("font-family", "Helvetica, sans-serif");
  volcanoDropdownList.style("font-size", "14px");
  volcanoDropdownList.style("position", "absolute");

  //scritta ALL
  let allOption = createDiv("All");
  allOption.parent(volcanoDropdownList);
  allOption.style("padding", "6px 10px");
  allOption.style("cursor", "pointer");
  allOption.style("color", "#1B2632");
  allOption.mousePressed(() => {
    activeType = null;
    volcanoDropdownDiv.html("All ▾");
    volcanoDropdownList.style("display", "none");
  });

  for (let type of volcanoTypes) {
    let option = createDiv(type);
    option.parent(volcanoDropdownList);
    option.style("padding", "6px 10px");
    option.style("cursor", "pointer");

    let c = typeColors[type];
    let colString =
      "#" + hex(red(c), 2) + hex(green(c), 2) + hex(blue(c), 2);
    option.style("color", colString);

    option.mousePressed(() => {
      activeType = type;
      volcanoDropdownDiv.html(type + " ▾");
      volcanoDropdownList.style("display", "none");
    });
  }

  volcanoDropdownDiv.mousePressed(() => {
    volcanoDropdownList.style(
      "display",
      volcanoDropdownList.style("display") === "none" ? "block" : "none"
    );
  });
}

//
// COLORI VULCANI
//
function assignTypeColors() {
  let palette = [
    color("#FFB162"),
    color("#A35139"),
    color("#733635"),
    color("#351E1C"),
    color("#ffc562ff"),
    color("#f9de7aff"),
    color("#c2693aff"),
  ];
  for (let i = 0; i < volcanoTypes.length; i++) {
    typeColors[volcanoTypes[i]] = palette[i % palette.length];
  }
}

//
// WINDOW RESIZE
//
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawLegendBox(); // riposiziona correttamente il dropdown
}


