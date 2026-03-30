document.addEventListener('DOMContentLoaded', () => {
    // 1. SOS Functionality
    const sosBtn = document.getElementById('sos-btn');
    
    // Audio synthesis for siren
    let audioCtx;
    function playSiren() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume if suspended (browser policies)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'square';
        
        // Wobble effect for siren
        const duration = 2; // play for 2 seconds
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        for(let i=0; i<duration*5; i++) {
            osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + i*0.2 + 0.1);
            osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + i*0.2 + 0.2);
        }

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
    }

    sosBtn.addEventListener('click', () => {
        playSiren();
        
        // Simulate message
        setTimeout(() => {
            alert('Emergency Alert Sent! Fetching location...');
            getLocation();
        }, 300);
    });

    // 2. Geolocation API
    const latDisplay = document.getElementById('lat-display');
    const lonDisplay = document.getElementById('lon-display');
    const mapsLink = document.getElementById('maps-link');
    const getLocBtn = document.getElementById('get-loc-btn');

    if (getLocBtn) {
        getLocBtn.addEventListener('click', () => {
            getLocation(false);
        });
    }

    function getLocation(isEmergency = true) {
        if (navigator.geolocation) {
            latDisplay.textContent = "Fetching Latitude...";
            lonDisplay.textContent = "Fetching Longitude...";
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    latDisplay.textContent = `Latitude: ${lat}`;
                    lonDisplay.textContent = `Longitude: ${lon}`;
                    
                    const locUrl = `https://www.google.com/maps?q=${lat},${lon}`;
                    mapsLink.href = locUrl;
                    mapsLink.style.display = 'inline-block';
                    
                    const shareBtn = document.getElementById('share-loc-btn');
                    shareBtn.style.display = 'inline-block';
                    shareBtn.onclick = () => {
                        const message = `Emergency! I need help. My live location is here: ${locUrl}`;
                        if (navigator.share) {
                            navigator.share({
                                title: 'Emergency Location',
                                text: message
                            }).catch(console.error);
                        } else {
                            navigator.clipboard.writeText(message);
                            alert("Location link copied to clipboard!");
                        }
                    };
                    
                    const offlineSmsBtn = document.getElementById('offline-sms-btn');
                    if (offlineSmsBtn) {
                        offlineSmsBtn.style.display = 'inline-block';
                        offlineSmsBtn.onclick = () => {
                            let contacts = JSON.parse(localStorage.getItem('safeHerContacts')) || [];
                            const msgPrefix = isEmergency ? 'Emergency! I need help.' : 'Please check my location.';
                            const message = `${msgPrefix} Location: ${locUrl}`;
                            
                            if (contacts.length > 0) {
                                const phones = contacts.map(c => c.phone).join(',');
                                window.location.href = `sms:${phones}?body=${encodeURIComponent(message)}`;
                            } else {
                                window.location.href = `sms:?body=${encodeURIComponent(message)}`;
                            }
                        };
                    }

                    if (isEmergency) {
                        let contacts = JSON.parse(localStorage.getItem('safeHerContacts')) || [];
                        if(contacts.length > 0) {
                            const phones = contacts.map(c => c.phone).join(',');
                            const message = `Emergency! I need help. My location: ${locUrl}`;
                            if(confirm(`Location fetched! Send emergency SMS to your ${contacts.length} saved contacts?`)) {
                                window.location.href = `sms:${phones}?body=${encodeURIComponent(message)}`;
                            }
                        } else {
                            alert(`Location fetched, but no contacts saved to send emergency SMS!`);
                        }
                    }
                },
                (error) => {
                    alert('Unable to retrieve location. Please allow location access.');
                    latDisplay.textContent = "Latitude: Access Denied";
                    lonDisplay.textContent = "Longitude: Access Denied";
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
        }
    }

    // 3. Contacts Management
    const contactForm = document.getElementById('contact-form');
    const contactsUl = document.getElementById('contacts-ul');

    function loadContacts() {
        const contacts = JSON.parse(localStorage.getItem('safeHerContacts')) || [];
        contactsUl.innerHTML = '';
        
        if (contacts.length === 0) {
            contactsUl.innerHTML = '<p>No contacts saved yet.</p>';
            return;
        }

        contacts.forEach((contact, index) => {
            const li = document.createElement('li');
            li.className = 'contact-item';
            
            const info = document.createElement('span');
            info.textContent = `${contact.name} - ${contact.phone}`;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'contact-actions';
            
            const waBtn = document.createElement('button');
            waBtn.className = 'action-btn wa-btn';
            waBtn.textContent = 'WhatsApp';
            waBtn.onclick = () => {
                const mapUrl = document.getElementById('maps-link')?.href || '';
                const urlValid = mapUrl !== '#' && !mapUrl.includes(window.location.host);
                let msg = 'Emergency! I need help.';
                if (urlValid) msg += ` My live location: ${mapUrl}`;
                window.open(`https://wa.me/${contact.phone}?text=${encodeURIComponent(msg)}`, '_blank');
            };
            
            const smsBtn = document.createElement('button');
            smsBtn.className = 'action-btn sms-btn';
            smsBtn.textContent = 'SMS';
            smsBtn.onclick = () => {
                const mapUrl = document.getElementById('maps-link')?.href || '';
                const urlValid = mapUrl !== '#' && !mapUrl.includes(window.location.host);
                let msg = 'Emergency! I need help.';
                if (urlValid) msg += ` My live location: ${mapUrl}`;
                window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(msg)}`;
            };
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', () => deleteContact(index));
            
            actionsDiv.appendChild(waBtn);
            actionsDiv.appendChild(smsBtn);
            actionsDiv.appendChild(delBtn);
            
            li.appendChild(info);
            li.appendChild(actionsDiv);
            contactsUl.appendChild(li);
        });
    }

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('contact-name').value.trim();
        const phoneInput = document.getElementById('contact-phone').value.trim();
        
        if (nameInput && phoneInput) {
            const contacts = JSON.parse(localStorage.getItem('safeHerContacts')) || [];
            contacts.push({ name: nameInput, phone: phoneInput });
            localStorage.setItem('safeHerContacts', JSON.stringify(contacts));
            
            contactForm.reset();
            loadContacts();
        }
    });

    function deleteContact(index) {
        let contacts = JSON.parse(localStorage.getItem('safeHerContacts')) || [];
        contacts.splice(index, 1);
        localStorage.setItem('safeHerContacts', JSON.stringify(contacts));
        loadContacts();
    }

    // Initial load
    loadContacts();
});
