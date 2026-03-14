        const canvas = document.getElementById('parliament-canvas');
        const legend = document.getElementById('legend');
        const TOTAL_SEATS = 460;
        
        let parties = [
            { name: "Lewica", seats: 26, color: "#ce1c24" },
            { name: "Koalicja Obywatelska", seats: 157, color: "#f7a500" },
            { name: "Trzecia Droga", seats: 64, color: "#ffd700" },
            { name: "PiS", seats: 190, color: "#263778" },
            { name: "Konfederacja", seats: 18, color: "#122744" },
            { name: "Niezrzeszeni", seats: 5, color: "#808080" }
        ];

        function generateSeatPositions() {
            const positions = [];
            const rowConfigs = [
                { radius: 120, count: 20 },
                { radius: 150, count: 25 },
                { radius: 180, count: 30 },
                { radius: 210, count: 35 },
                { radius: 240, count: 40 },
                { radius: 270, count: 45 },
                { radius: 300, count: 50 },
                { radius: 330, count: 60 },
                { radius: 360, count: 70 },
                { radius: 390, count: 85 }
            ];

            rowConfigs.forEach(row => {
                for (let i = 0; i < row.count; i++) {
                    if (positions.length >= TOTAL_SEATS) break;
                    
                    // Kąt od 0 do PI (półkole)
                    // Dodajemy mały margines (0.1), żeby fotele nie dotykały samej ziemi
                    const angle = Math.PI - (Math.PI * (i / (row.count - 1)));
                    
                    const x = 450 + row.radius * Math.cos(angle);
                    const y = 470 - row.radius * Math.sin(angle);
                    
                    positions.push({ x, y });
                }
            });
            return positions;
        }

        function draw() {
            canvas.innerHTML = '';
            legend.innerHTML = '';
            const coords = generateSeatPositions();
            let seatCounter = 0;

            parties.forEach(party => {
                // Legenda
                const card = document.createElement('div');
                card.className = 'party-card';
                card.style.borderLeftColor = party.color;
                card.innerHTML = `<strong>${party.name}</strong><br>${party.seats} posłów`;
                legend.appendChild(card);

                // Fotele
                for (let i = 0; i < party.seats; i++) {
                    if (seatCounter >= TOTAL_SEATS) break;
                    
                    const s = document.createElement('div');
                    s.className = 'seat';
                    s.style.left = `${coords[seatCounter].x - 5}px`;
                    s.style.top = `${coords[seatCounter].y - 5}px`;
                    s.style.backgroundColor = party.color;
                    s.title = `${party.name} - Poseł nr ${i + 1}`;
                    canvas.appendChild(s);
                    seatCounter++;
                }
            });

            // Wypełnij resztę pustymi miejscami
            for (let i = seatCounter; i < TOTAL_SEATS; i++) {
                const s = document.createElement('div');
                s.className = 'seat';
                s.style.left = `${coords[i].x - 5}px`;
                s.style.top = `${coords[i].y - 5}px`;
                canvas.appendChild(s);
            }
        }

        function addParty() {
            const name = document.getElementById('pName').value;
            const seats = parseInt(document.getElementById('pSeats').value);
            const color = document.getElementById('pColor').value;

            if (name && !isNaN(seats)) {
                parties.push({ name, seats, color });
                draw();
            }
        }

        function clearAll() {
            parties = [];
            draw();
        }

        draw();
