// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");
    const messagesList = document.getElementById("messagesList");

    if (!contactForm) return; // Guard: exit if form not found

    // Function to fetch and display all messages
    const loadMessages = async () => {
        try {
            const response = await fetch("/api/messages");
            if (!response.ok) {
                let errText = `Status ${response.status}`;
                try {
                    const errBody = await response.json();
                    errText = errBody.error || errBody.message || JSON.stringify(errBody);
                } catch (_e) {}
                throw new Error(errText);
            }
            const messages = await response.json();

            if (messages.length === 0) {
                messagesList.innerHTML = "<p>No messages yet. Be the first to send one!</p>";
                return;
            }

            // Clear loading text and display messages
            messagesList.innerHTML = "";
            messages.forEach((msg) => {
                const messageDiv = document.createElement("div");
                messageDiv.className = "message-card";
                messageDiv.innerHTML = `
                    <div class="message-header">
                        <h3>${msg.name}</h3>
                        <p class="message-email">${msg.email}</p>
                    </div>
                    <p class="message-content">${msg.message}</p>
                `;
                messagesList.appendChild(messageDiv);
            });
        } catch (error) {
            messagesList.innerHTML = "<p>Could not load messages. Please try again later.</p>";
            console.error("Error loading messages:", error);
        }
    };

    // Load messages on page load
    loadMessages();

    // Handle form submission
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent page reload

        // Collect form data
        const formData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        // Disable button while sending
        const submitButton = contactForm.querySelector("button[type='submit']");
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

        try {
            // Send data to backend (relative path works on Vercel deployment)
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                let errText = `Status ${response.status}`;
                try {
                    const errBody = await response.json();
                    errText = errBody.error || errBody.message || JSON.stringify(errBody);
                } catch (_e) {}
                throw new Error(errText);
            }

            const result = await response.json();

            // Show success message
            alert("✅ " + (result.message || "Message sent successfully!"));

            // Reset form after successful submission
            contactForm.reset();

            // Reload messages to show the new submission
            loadMessages();
        } catch (error) {
            // Show error message
            alert("❌ An error occurred while sending your message. Please try again later.");
            console.error("Error:", error);
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = "Send Message";
        }
    });
});