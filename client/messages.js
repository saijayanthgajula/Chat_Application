// Fetch the data from the API
fetch('/admin/messages', { method: "POST" })
    .then(response => response.json())
    .then(data => {
        const messageListContainer = document.getElementById('messageList');

        const groupedMessages = {};

        // Group the messages by sender name
        data.forEach(message => {
            if (!groupedMessages[message.sender_name]) {
                groupedMessages[message.sender_name] = [];
            }
            groupedMessages[message.sender_name].push(message);
        });

        Object.entries(groupedMessages).forEach(([senderName, messages]) => {
            // Create the accordian container
            const accordianContainer = document.createElement('div');
            accordianContainer.classList.add('accordian');
            // Create the header element
            const header = document.createElement('div');
            header.classList.add('header');
            header.textContent = senderName;

            // Create the content element
            const content = document.createElement('div');
            content.classList.add('content');

            // Loop through the messages for the current sender and create HTML elements for each message
            messages.forEach(message => {
                // Create elements for each property of the message
                const messageDiv = document.createElement('div')
                messageDiv.classList.add('message')
                const senderId = document.createElement('p');
                senderId.textContent = 'Sender ID: ' + message.sender_id;

                const messageContent = document.createElement('p');
                messageContent.textContent = 'Content: ' + message.content;

                const timestamp = document.createElement('p');
                const timestampData = new Date(message.timestamp._seconds * 1000 + message.timestamp._nanoseconds / 1000000);
                timestamp.textContent = 'Timestamp: ' + timestampData.toLocaleString();

                // Append the message elements to the content
                messageDiv.appendChild(senderId);
                messageDiv.appendChild(messageContent);
                messageDiv.appendChild(timestamp);
                content.appendChild(messageDiv);
            });

            accordianContainer.appendChild(header);
            accordianContainer.appendChild(content);

            header.addEventListener('click', () => {
                accordianContainer.classList.toggle('active');
            });

            messageListContainer.appendChild(accordianContainer);
        });
    })
    .catch(error => {
        console.error(error);
    });