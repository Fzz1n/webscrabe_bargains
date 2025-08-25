async function get_offers(offers){
    document.getElementById('send_wish_req').addEventListener('click', () => {
        document.getElementById("send_wish_req").disabled = true;
        let invalid_input_found = false;
        let wish_list = [];
        // Array fields
        document.querySelectorAll('#wishlist_products_id input').forEach(input => {
            const field = input.dataset.field;
            const index = input.dataset.index;
            const value = input.value.trim();

            // If the value is not empty, validate it
            if (value !== '' && isNaN(value)) {
                if(!is_valid_input(value)) {
                    invalid_input_found = true;
                    alert(`Invalid input in the field: ${field} ${index + 1}. Only letters, numbers, commas, minus and periods are allowed.`);
                } else {
                    wish_list.push(value);
                }
            }
        });

        console.log('Wish-list: ', wish_list);
        /*// If no invalid inputs were found, save data
        if (!invalid_input_found) {
            // Save the updated data in localStorage
            localStorage.setItem('wish_list', JSON.stringify(wish_list));
            console.log('Updated Stock Data:', wish_list);

            // Show a success message, when saved
            alert("Data saved!");
        }*/
        const table_body = document.querySelector('#result_id tbody');
        table_body.innerHTML = ''; // Clear previous data

        // Find the items from wishlist from the offers
        for (let i = 0; i < wish_list.length; i++){
            let product_found = false;

            for (let j = 0; j < offers.length; j++){
                if(offers[j].name.toLowerCase().includes(wish_list[i].toLowerCase())){
                    product_found = true;
                    
                    // Create row and cells
                    const row = document.createElement('tr');

                    // Name
                    const td_name = document.createElement('td');
                    td_name.textContent = offers[j].name;
                    row.appendChild(td_name);

                    // Price 
                    const td_price = document.createElement('td');
                    // If not definded calc: "unit_price" / 1000 * smallest amount from "amount"
                    if(offers[j].price === null){
                        const min_amount = offers[j].amount.match(/^\d+/);
                        td_price.textContent = parseInt(offers[j].unit_price / 1000 * min_amount[0]);
                    } else {
                        td_price.textContent = offers[j].price;
                    }
                    row.appendChild(td_price);

                    // Amount
                    const td_amount = document.createElement('td');
                    td_amount.textContent = offers[j].amount + offers[j].unit;
                    row.appendChild(td_amount);

                    // Unit Price
                    const td_unit_price = document.createElement('td');
                    td_unit_price.textContent = offers[j].unit_price.toString().replace('.', ',') + ' ' + offers[j].unit_to_price;
                    row.appendChild(td_unit_price);
                    
                    table_body.appendChild(row);
                    break;
                }
            }

            if (!product_found){
                console.log(`${wish_list[i]}: blev ikke fundet`)
            }
        }

        document.getElementById("result_id").style.visibility = "visible";
        document.getElementById("send_wish_req").disabled = false;
    });

};

function is_valid_input(value) {
    const regex = /^[a-zA-ZæøåÆØÅ0-9,.\-\s]+$/; // only (, - . letters and numbers)
    return regex.test(value);
}

window.addEventListener('pageshow', async () => {
    // Get offers
    const offers_raw = await fetch('/api/offers');
    const offers = await offers_raw.json();
    console.log('Number of offers:', offers.length);
    console.log('Offer retrieved from DB:', offers);

    get_offers(offers);
});