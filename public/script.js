document.addEventListener('DOMContentLoaded', function () {
const page = document.body.dataset.page; //get the data-page attribute

    // modal 
    const form = document.querySelector('.modal-form');

    if(page === 'home-page'){
        //to show the button (a tag)
        //async is used because we’re going to make an asynchronous (non-blocking) HTTP request inside it.
        form.addEventListener('submit', async function (e) {
            e.preventDefault(); //prevent full reload

            const formData = new FormData(form); //to create an object from the form
            const data = Object.fromEntries(formData.entries()); //to convert it to a plain js object
            //so data can be sent as JSON

            //AJAX
            //so it keeps you on the same page and shows the item link without needing to reload.
            try {
                const response = await fetch('/submit', { //fetch makes http requests
                    method: 'POST', //we are submitting data
                    headers: { 'Content-Type': 'application/json' }, //tells the server to expect json
                    body: JSON.stringify(data) //sends the form data converted to a string in the request body
                });

                if (response.ok) { //if we have status 2xx -> request successfull (item saved)
                    form.reset(); // clear form if needed

                    //This shows the link after the form is submitted
                    const containerBtn = document.getElementById('item-btn-container');

                    let itemBtn = document.querySelector('.items-btn');
                    //after successful form submission, check if the button exists:
                    if (!itemBtn) {
                        itemBtn = document.createElement('a');
                        itemBtn.href = '/items-list';
                        itemBtn.className = 'items-btn';
                        itemBtn.textContent = 'Menu items ready to order';
                        containerBtn.appendChild(itemBtn);
                    }
                    itemBtn.style.display = 'inline-block';

                } else {
                    alert('Error submitting form');
                }
            } catch (err) {
            console.error('Error submitting form:', err);
            }
        })  
    }

    //to remove and edit items
    if(page==='menu-list'){
        updateCartTotal();

        const remainingItems = document.querySelectorAll('.menu-item');
        const cartBtn = document.querySelector('.cart-btn');
        if(remainingItems.length > 0){
            cartBtn.style.display = 'block';  // Show the icon when contacts are in the cart
            
            cartBtn.addEventListener('click', async function(){
                    //to send an object with a message string, not a DOM element, replace this:
                    // const message = document.querySelector('.thank-you-message');

                    // const response = await fetch('/thank-you', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(message)
                    // });
                    //with this:
                    // const messageContent = "Your order has been processed!";

                    //the fetch method fails silently, so I removed it (CHECK NOTES)
                    // const response = await fetch('/thank-you', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify({ message: messageContent }) 
                    //     //so you are sending a JSON object -> { "message": "Your order has been processed!" }
                    // });

                    //You were trying to JSON.stringify a DOM element, which isn’t valid.
                    // Fix it by sending a plain object { message: "..." } and then update your route to read the message from req.body.

                //update DB, DOM and redirect
                //when the cartBtn is clicked
                //Selects all .menu-item elements currently in the DOM:
                const menuItems = document.querySelectorAll('.menu-item');
                
                //extract their data-id attributes (MongoDb objectsIds)
                const idsToDelete = []; //create an empty array
                menuItems.forEach(menuItem => {
                    const id = menuItem.dataset.id; //get the id them from DB
                    if (id){
                        idsToDelete.push(id); //pushes each id from menu-item DOM element into the idsToDelete array
                        //then it's sent to the server via fetch -> body: JSON.stringify({ids: idsToDelete})
                    }
                });
                try{
                    //to send those IDs to the server in a delete request (rememebr fetch expects a json back)
                    const response = await fetch ('/delete-multiple', {
                        method: 'DELETE',
                        headers: {'Content-type':'application/json'},
                        body: JSON.stringify({ids: idsToDelete}) //here you send the array of IDs to the server as the body of the DELETE request.
                    }); //results -> deleting all items currently in DOM and DB

                    if(response.ok){
                        //remove items from DOM after succesfull deletion
                        menuItems.forEach(menuItem => menuItem.remove());
                        cartBtn.style.display = 'none';
                        updateCartTotal(); // to recalculate after removing items
                        
                        // Redirect to /thank-you 
                        window.location.href = ('/thank-you');
                        //or -> window.open('/thank-you', '_blank');
                        // to open the page on a new window 
                    } else{
                        alert('failed to delete items');
                    }
                } catch(err){
                    console.log('Error: ', err);
                }
            })
        }

        const trashBtns = document.querySelectorAll('.trash-btn');

        trashBtns.forEach(trashBtn => { //find all trash icons on the page
            trashBtn.addEventListener('click', async function () {
                const menuItem = this.closest('.menu-item'); //Finds the nearest ancestor .menu-item of the current element (this === trashBtn).
                const id = menuItem.dataset.id; //mongoDB objectId
                //Which gives you the _id you can send to your server to edit, delete or anything else

                try{
                    const response = await fetch(`/delete-item/${id}` ,{
                        method: 'DELETE'
                    })
                    if(response.ok){
                        menuItem.style.transition = 'opacity 0.3s';
                        menuItem.style.opacity = '0';
                        
                        setTimeout(() => {
                            menuItem.remove();

                            const remainingItems = document.querySelectorAll('.menu-item');
                            //Check if there are any remaining items
                            const emptyMsg = document.querySelector('.empty-msg');
                            const titleOrder = document.querySelector('.list-title');

                            if (remainingItems.length === 0) {
                                emptyMsg.style.display = 'block';  // Show the message when no contacts left
                                cartBtn.style.display = 'none'; //hide the btn
                            } else{
                                titleOrder.style.display = 'block';
                            }

                            //Check if .menu-item elements are left after removal.
                            //Do DOM updates after setTimeout, because removal happens there.

                            updateCartTotal(); //recalculate after deletion
                        }, 300);               
                    } else {
                        alert('Failed to delete item')
                    }
                } catch (err){
                    console.error('Error deleting item:', err);
                }
            })
        })

        document.querySelectorAll('.menu-item').forEach(menuItem => {
            const editBtn = menuItem.querySelector('.edit-btn');
            const saveBtn = menuItem.querySelector('.save-btn');

            editBtn.addEventListener('click', () => {
                // Swap <p> for <input> fields
                const nameEl = menuItem.querySelector('.name-name');
                const currentName = nameEl.textContent.replace('Name:', '').trim();
                nameEl.innerHTML = `<strong>Name:</strong> <input class="edit-name-input" value="${currentName}" />`;

                const descriptionEl = menuItem.querySelector('.name-description');
                const currentDescription = descriptionEl.textContent.replace('Description:', '').trim();
                descriptionEl.innerHTML = `<strong>Description:</strong> <input class="edit-description-input" value="${currentDescription}" />`;

                const priceEl = menuItem.querySelector('.name-price');
                // Get the text content: e.g. "Price: $4.50"
                const priceText = priceEl.textContent;
                // Extract the price string by removing the label
                const rawPrice = priceText.replace('Price:', '').trim(); // "$4.50"
                // Remove the dollar sign and parse to float
                const number = parseFloat(rawPrice.replace('$', ''));
                //Use number, or just reuse rawPrice without the "$"
                priceEl.innerHTML = `<strong>Price:</strong> <input class="edit-price-input" value="${number}" />`;
                
                // Show Save button, hide Edit button
                saveBtn.style.display = 'inline-block';
                editBtn.style.display = 'none';
            });

            saveBtn.addEventListener('click', async (e) => {
                e.preventDefault(); //prevent form submission or page reload
                // Get updated values from inputs
                const updatedName = menuItem.querySelector('.edit-name-input').value.trim();
                const updatedDescription = menuItem.querySelector('.edit-description-input').value.trim();
                const updatedPrice = menuItem.querySelector('.edit-price-input').value.trim();

                const id = menuItem.dataset.id;

                try {
                const response = await fetch(`/edit-item/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    name: updatedName,
                    description: updatedDescription,
                    price: updatedPrice,
                    })
                });

                if (response.ok) {
                    // Update UI to show updated text (switch back from input to <p>)
                    menuItem.querySelector('.name-name').innerHTML = `<strong>Name:</strong> ${updatedName}`;
                    menuItem.querySelector('.name-description').innerHTML = `<strong>Description:</strong> ${updatedDescription}`;
                    menuItem.querySelector('.name-price').innerHTML = `<strong>Price:</strong> ${updatedPrice}`;

                    // Show Edit button, hide Save button
                    editBtn.style.display = 'inline-block';
                    saveBtn.style.display = 'none';
                } else {
                    alert('Failed to update item');
                }
                } catch (error) {
                console.error('Error updating item:', error);
                alert('Server error while updating');
                }
            });
        });

        function updateCartTotal() {
        const priceEls = document.querySelectorAll('.name-price');
        let total = 0;

        priceEls.forEach(el => {
            // Extract text, remove label and $, then parse to float
            const priceText = el.textContent.replace('Price:', '').trim().replace('$', '');
            //el.textContent gets the text inside the element .name-price -> example Price: $4.50
            //replace removes the Price label -> $4.50
            //.trim removes any extra space
            //.replace again removes the dollar sign
            //so the string is cleaned from "Price: $4.50" → "4.50"

            //convert it into an integer
            const price = parseFloat(priceText);
            if (!isNaN(price)) { //if not a number -> !isNaN(...) means only add it if it’s a valid number
                total += price; //add valid number to the total
            }
        });

        // Update the total display getting the element by its id
        const totalPriceEl = document.getElementById('total-price');
        if (totalPriceEl) {
            totalPriceEl.textContent = total.toFixed(2); //two digits numbers after decimal point
        }
    }
    }
});






// Something to remember:
// In your /thank-you logic in the client-side JS, you used:
// body: JSON.stringify(data)
// But data isn't defined in that block — you may want:

// Either define data properly (e.g., order summary, etc.)
// Or just send an empty object {} if no data is needed:

// body: JSON.stringify({})
// Without this, it could throw a reference error.