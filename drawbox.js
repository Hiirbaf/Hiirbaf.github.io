/*
        
        FILL IN THESE VARIABLES BASED ON THE GUIDE AT https://drawbox.nekoweb.org
        
        IF YOU HAVE ANY QUESTION, SUGGESTIONS, OR NEED HELP, PLEASE EMAIL ME AT drawbox@jhorn.net OR @MONKEYBATION on DISCORD
        
				      /`·.¸
				     /¸...¸`:·
				 ¸.·´  ¸   `·.¸.·´)
				: © ):´;      ¸  {
				 `·.¸ `·  ¸.·´\`·¸)
				     `\\´´\¸.·´
        
*/
const GOOGLE_FORM_ID = "1FAIpQLSc7gk7Ot8_wF9SchGaDx5xf_Pc5v-XU0d4s3hNw7BBeK8ZSuw"; 
const IMAGE_ENTRY_ID = "entry.1369949347";
const NAME_ENTRY_ID = "entry.15412514";      
const WEBSITE_ENTRY_ID = "entry.306295053";  // Replace with new name field entry ID
const GOOGLE_SHEET_ID = "11w2LvZuljHliPFVvejbYIbyd_mXpcWefKuzUa8cVbnI";
const DISPLAY_IMAGES = true;

/*
        
        DONT EDIT BELOW THIS POINT IF YOU DONT KNOW WHAT YOU ARE DOING.
        
*/

const CLIENT_ID = "b4fb95e0edc434c";
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/" + GOOGLE_SHEET_ID + "/export?format=csv";
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/" + GOOGLE_FORM_ID + "/formResponse";

const HALFTONE_PATTERN = [
    [1,1,0,0,0,0],  // xxoooo
    [1,1,0,0,0,0],  // xxoooo
    [0,0,0,0,0,0],  // oooooo
    [0,0,0,0,0,0],  // oooooo
    [0,0,0,0,0,0],  // oooooo
    [0,0,0,1,1,0],  // oooxxo
    [0,0,0,1,1,0],  // oooxxo
    [0,0,0,0,0,0],  // oooooo
    [0,0,0,0,0,0],  // oooooo
    [0,0,0,0,0,0]   // oooooo
];


const HALFTONE_COLOR = "HALFTONE_PATTERN";

let canvas = document.getElementById("drawboxcanvas");
let context = canvas.getContext("2d");
context.fillStyle = "white";
context.fillRect(0, 0, canvas.width, canvas.height);

let restore_array = [];
let start_index = -1;
let stroke_color = "black";
let stroke_width = "8";   /*brush starting size - should match "stroke_width = this.value" in html*/
let is_drawing = false;

let lastX = 0;
let lastY = 0;

function change_color(element) {
    stroke_color = element.style.background;
    if (element.getAttribute('data-halftone') === 'true') {
        stroke_color = HALFTONE_COLOR;
    }
}


function updateBrushSize(value, source) {
    stroke_width = value;
    
    if (source === 'slider') {
        document.getElementById('brush-input').value = value;
    } else if (source === 'input') {
        document.getElementById('brush-slider').value = value;
    }
}



document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('brush-slider').addEventListener('input', function() {
        updateBrushSize(this.value, 'slider');
    });
    
    document.getElementById('brush-input').addEventListener('input', function() {
        updateBrushSize(this.value, 'input');
    });
    
    setDrawMode(); 
});

function start(event) {
  is_drawing = true;
  const x = getX(event);
  const y = getY(event);
  
  lastX = x;
  lastY = y;
  
  context.beginPath();
  context.moveTo(x, y);
  event.preventDefault();
}




function drawHalftonePath(x1, y1, x2, y2, size) {
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const step = Math.max(1, size / 10);
    const steps = Math.ceil(distance / step);
    
    context.fillStyle = "#000000";
    
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const centerX = x1 + (x2 - x1) * t;
        const centerY = y1 + (y2 - y1) * t;
        
        
        const radius = size / 2;
        const startX = Math.floor(centerX - radius);
        const endX = Math.ceil(centerX + radius);
        const startY = Math.floor(centerY - radius);
        const endY = Math.ceil(centerY + radius);
        
        for (let py = startY; py <= endY; py++) {
            for (let px = startX; px <= endX; px++) {
                const dx = px - centerX;
                const dy = py - centerY;
                const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                
                if (distanceFromCenter <= radius && px >= 0 && py >= 0 && px < canvas.width && py < canvas.height) {
                    const patternX = ((px % 6) + 6) % 6;  // replace these 3 with thewidth (6x10 would be x6, y10)
					const patternY = ((py % 10) + 10) % 10;  // height
                    
                    if (HALFTONE_PATTERN[patternY][patternX] === 1) {
                        context.fillRect(px, py, 1, 1);
                    }
                }
            }
        }
    }
}





function draw(event) {
  if (!is_drawing) return;
  
  const currentX = getX(event);
  const currentY = getY(event);
  
  if (is_erasing) {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "rgba(0,0,0,1)"; 
  } else {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = stroke_color;
  }
  
  context.lineWidth = stroke_width;

  drawSquarePath(lastX, lastY, currentX, currentY, stroke_width);


  lastX = currentX;
  lastY = currentY;
  
  event.preventDefault();
}

function drawSquarePath(x1, y1, x2, y2, size) {
    if (stroke_color === HALFTONE_COLOR) {
        drawHalftonePath(x1, y1, x2, y2, size);
        return;
    }
    

    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const maxGap = size * 0.6;
    if (distance > maxGap) {
        const steps = Math.ceil(distance / maxGap);
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            if (is_erasing) {
                context.clearRect(x - size/2, y - size/2, size, size);
            } else {
                context.fillStyle = stroke_color;
                context.fillRect(x - size/2, y - size/2, size, size);
            }
        }
    }
    
    if (is_erasing) {
        context.clearRect(x2 - size/2, y2 - size/2, size, size);
    } else {
        context.fillStyle = stroke_color;
        context.fillRect(x2 - size/2, y2 - size/2, size, size);
    }
}

function stop(event) {
  if (!is_drawing) return;
  context.stroke();
  context.closePath();
  is_drawing = false;

	
  context.globalCompositeOperation = "source-over";
  
  restore_array.push(context.getImageData(0, 0, canvas.width, canvas.height));
  start_index++;
  event.preventDefault();
}

function getX(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  
  if (event.clientX !== undefined) {
    return (event.clientX - rect.left) * scaleX;
  } else {
    return (event.targetTouches[0].clientX - rect.left) * scaleX;
  }
}

function getY(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height; 
  
  if (event.clientY !== undefined) {
    // Mouse event
    return (event.clientY - rect.top) * scaleY;
  } else {
    // Touch event
    return (event.targetTouches[0].clientY - rect.top) * scaleY;
  }
}

canvas.addEventListener("touchstart", function(e) {
    e.preventDefault();
    start(e);
}, { passive: false });

canvas.addEventListener("touchmove", function(e) {
    e.preventDefault();
    draw(e);
}, { passive: false });

canvas.addEventListener("touchend", function(e) {
    e.preventDefault();
    stop(e);
}, { passive: false });


canvas.addEventListener("mousedown", start, false);
canvas.addEventListener("mousemove", draw, false);
canvas.addEventListener("mouseup", stop, false);
canvas.addEventListener("mouseout", stop, false);

function Restore() {
  if (start_index <= 0) {
    Clear();
  } else {
    start_index--;
    restore_array.pop();
    context.putImageData(restore_array[start_index], 0, 0);
  }
}

function Clear() {
  context.fillStyle = "white";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillRect(0, 0, canvas.width, canvas.height);
  restore_array = [];
  start_index = -1;
}

context.drawImage = function() {
	console.warn("noo >:(");
};

// Add Ctrl+Z keyboard shortcut for undo
document.addEventListener("keydown", function(event) {
    // Check if Ctrl+Z is pressed (or Cmd+Z on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault(); // Prevent browser's default undo
        Restore(); // Call the existing undo function
    }
});

document.getElementById("submit").addEventListener("click", async function () {
  const submitButton = document.getElementById("submit");
  const statusText = document.getElementById("status");
  

  const artistName = document.getElementById("artist-name").value.trim();
  const artistWebsite = document.getElementById("artist-website").value.trim();
  const spamCheck = document.getElementById("spam-check").value.trim();
  

  if (!artistName) {
    alert("Please enter your name!");
    return;
  }
  
  if (spamCheck.toLowerCase() !== "guestbook") {
    alert("Please enter 'guestbook' in the spam blocker field!");
    return;
  }

  submitButton.disabled = true;
  statusText.textContent = "Uploading...";

  const imageData = canvas.toDataURL("image/png");
  const blob = await (await fetch(imageData)).blob();
  const formData = new FormData();
  formData.append("image", blob, "drawing.png");

  try {
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: `Client-ID ${CLIENT_ID}` },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error("Imgur upload failed");

    const imageUrl = data.data.link;
    console.log("Uploaded image URL:", imageUrl);


    let submissionData = imageUrl;
    if (artistName) {
      submissionData += " | " + artistName;
    }
    if (artistWebsite) {
      submissionData += " | " + artistWebsite;
    }

    const googleFormData = new FormData();
    googleFormData.append(IMAGE_ENTRY_ID, imageUrl);
    googleFormData.append(NAME_ENTRY_ID, artistName);
    if (artistWebsite) {
      googleFormData.append(WEBSITE_ENTRY_ID, artistWebsite);
    }

    await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      body: googleFormData,
      mode: "no-cors",
    });

    statusText.textContent = "Upload successful!";
    alert("Image uploaded and submitted successfully ☻");
    location.reload();
  } catch (error) {
    console.error(error);
    statusText.textContent = "Error uploading image.";
    alert("Error uploading image or submitting to Google Form.");
  } finally {
    submitButton.disabled = false;
  }
});

async function fetchImages() {
  if (!DISPLAY_IMAGES) {
    console.log("Image display is disabled.");
    return;
  }

  try {
    console.log("Fetching from URL:", GOOGLE_SHEET_URL);
    const response = await fetch(GOOGLE_SHEET_URL);
    console.log("Response status:", response.status);
    
    const csvText = await response.text();
    console.log("CSV data received:", csvText);
    
    const rows = csvText.split("\n").slice(1);
    console.log("Rows after splitting:", rows);

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    
    if (rows.length === 0 || (rows.length === 1 && rows[0].trim() === "")) {
      console.log("No data rows found");
      gallery.innerHTML = "No images submitted yet.";
      return;
    }


	  
    // Limit to 12 most recent images
	    const approvedRows = rows.filter(row => {
	      const columns = row.split(",");
	      // Check if the "Approved" column (index 4) has any value (x, yes, approved, etc.)
	      const approvedStatus = columns[5] ? columns[5].trim().replace(/"/g, "") : "";
	      return approvedStatus !== "" && approvedStatus.toLowerCase() !== "no";
	    });
	    
	    const recentApprovedRows = approvedRows.reverse().slice(0, 12);
	    
	    recentApprovedRows.forEach((row, index) => {
	      console.log(`Processing approved row ${index}:`, row);
	      
	      const columns = row.split(",");
	      console.log("Columns:", columns);
	      
	      if (columns.length < 2) {
	        console.log("Skipping row - not enough columns");
	        return;
	     }

      const rawTimestamp = columns[0].trim();
		// Timestap formatting "2025.08.26"
		const date = new Date(rawTimestamp);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const timestamp = `${year}.${month}.${day}`;

      const imgUrl = columns[1].trim().replace(/"/g, "");
      const artistName = columns[2] ? columns[2].trim().replace(/"/g, "") : "Anonymous";
      const artistWebsite = columns[3] ? columns[3].trim().replace(/"/g, "") : "";
      
      if (imgUrl.startsWith("http")) {
        const div = document.createElement("div");
        div.classList.add("image-container");

		  
        let artistLine = artistName;
        if (artistWebsite && artistWebsite.startsWith("http")) {
          artistLine += ` // <a href="${artistWebsite}" target="_blank">website</a>`;
        }

        div.innerHTML = `
                    <img src="${imgUrl}" alt="drawing by ${artistName}">
                    <p class="artist-line">${artistLine}</p>
                    <p class="timestamp">${timestamp}</p>
                `;
        gallery.appendChild(div);
        console.log("Sent!");
      }
    });



	  
    const totalApproved = approvedRows.length;
	  
	const archiveLink = document.querySelector('a[href="/archive"]');
	if (archiveLink && totalApproved > 0) {
	  archiveLink.textContent = `View Archive (${totalApproved})`;
	}
	
	if (totalApproved > 12) {
	  const moreDiv = document.createElement("div");
	  moreDiv.style.gridColumn = "1 / -1";
	  moreDiv.style.textAlign = "center";
	  moreDiv.style.marginTop = "40px";
	  moreDiv.innerHTML = `<p><a href="/archive">View all ${totalApproved} drawings in the archive →</a></p>`;
	  gallery.appendChild(moreDiv);
	}

	  
  } catch (error) {
    console.error("Error fetching images:", error);
    document.getElementById("gallery").textContent = "Failed to load images.";
  }
}


fetchImages();




let is_erasing = false;

function setDrawMode() {
    is_erasing = false;
    
   
	
    document.getElementById("draw-btn").classList.add("active-tool");
    document.getElementById("erase-btn").classList.remove("active-tool");
    
    
    canvas.style.cursor = "crosshair";
}

function setEraseMode() {
    is_erasing = true;
    
    
    document.getElementById("draw-btn").classList.remove("active-tool");
    document.getElementById("erase-btn").classList.add("active-tool");
    
   
    canvas.style.cursor = "grab";
}


document.addEventListener("DOMContentLoaded", function() {
    setDrawMode(); 
});











