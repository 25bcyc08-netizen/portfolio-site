// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");
    const messagesList = document.getElementById("messagesList");

    if (!contactForm) return; // Guard: exit if form not found

    // Determine API base for local dev vs production
    // always include the `/api` prefix used by the serverless functions
    // on Vercel; for localhost we need the full host so requests go to the
    // backend server running on port 5000.
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';

    // Function to fetch and display all messages
    const loadMessages = async () => {
        try {
            const response = await fetch(`${API_BASE}/messages`);
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

                const header = document.createElement("div");
                header.className = "message-header";

                const nameEl = document.createElement("h3");
                nameEl.textContent = msg.name;

                const emailEl = document.createElement("p");
                emailEl.className = "message-email";
                emailEl.textContent = msg.email;

                header.append(nameEl, emailEl);

                const contentEl = document.createElement("p");
                contentEl.className = "message-content";
                contentEl.textContent = msg.message;

                messageDiv.append(header, contentEl);
                messagesList.appendChild(messageDiv);
            });
        } catch (error) {
            messagesList.innerHTML = "<p>Could not load messages. Please try again later.</p>";
            console.error("Error loading messages:", error);
        }
    };

    // Load messages on page load
    loadMessages();

    // Handle clear messages button
    const clearMessagesBtn = document.getElementById('clearMessagesBtn');
    const clearStatus = document.getElementById('clear-status');

    clearMessagesBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete ALL messages? This action cannot be undone.')) {
            return;
        }

        clearMessagesBtn.disabled = true;
        clearMessagesBtn.textContent = 'Clearing...';
        clearStatus.textContent = 'Deleting all messages...';

        try {
            const response = await fetch(`${API_BASE}/messages`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            clearStatus.textContent = `✅ ${result.message} (${result.deletedCount} messages deleted)`;
            clearStatus.style.color = '#28a745';

            // Reload messages to show empty list
            loadMessages();

        } catch (error) {
            console.error('Error clearing messages:', error);
            clearStatus.textContent = '❌ Failed to clear messages. Please try again.';
            clearStatus.style.color = '#e74c3c';
        } finally {
            clearMessagesBtn.disabled = false;
            clearMessagesBtn.textContent = 'Clear All Messages';
        }
    });

    // Handle form submission
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent page reload

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.getElementById('submit-status').textContent = '';

        // Collect form data
        const formData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        // Client-side validation
        const errors = {};
        if (!formData.name || formData.name.length < 2) {
            errors.name = "Name must be at least 2 characters long";
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }
        if (!formData.message || formData.message.length < 10) {
            errors.message = "Message must be at least 10 characters long";
        }

        // Display validation errors
        if (Object.keys(errors).length > 0) {
            Object.keys(errors).forEach(field => {
                document.getElementById(`${field}-error`).textContent = errors[field];
            });
            document.getElementById('submit-status').textContent = 'Please fix the errors above';
            return;
        }

        // Disable button while sending
        const submitButton = contactForm.querySelector("button[type='submit']");
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        document.getElementById('submit-status').textContent = 'Sending your message...';

        try {
            // Send data to backend (relative path works on Vercel deployment)
            const response = await fetch(`${API_BASE}/contact`, {
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
            document.getElementById('submit-status').textContent = result.message || "Message sent successfully!";
            document.getElementById('submit-status').style.color = '#28a745';

            // Reset form after successful submission
            contactForm.reset();

            // Reload messages to show the new submission
            loadMessages();
        } catch (error) {
            // Show error message
            console.error("Error:", error);

            let errorMessage = "An error occurred while sending your message. Please try again later.";

            try {
                const errorData = JSON.parse(error.message);
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorMessage = errorData.errors.join('. ');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Keep default error message
            }

            document.getElementById('submit-status').textContent = errorMessage;
            document.getElementById('submit-status').style.color = '#e74c3c';
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = "Send Message";
        }
    });
});