async function get_bargains(bargains){
    let wishlist_bargains = [];

    document.getElementById('send_wish_req').addEventListener('click', () => {
        document.getElementById("send_wish_req").disabled = true;
        let invalid_input_found = false;
        wishlist_bargains = [];
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

        // Find the items from wishlist from the bargains
        for (let i = 0; i < wish_list.length; i++){
            let product_found = false;
            wishlist_bargains.push({ category: wish_list[i], items: [] });

            for (let j = 0; j < bargains.length; j++){
                if(bargains[j].name.toLowerCase().includes(wish_list[i].toLowerCase())){
                    product_found = true;
                    
                    // Create row and cells
                    const row = document.createElement('tr');

                    // Name
                    const td_name = document.createElement('td');
                    td_name.textContent = bargains[j].name;

                   /* if (!Array.isArray(wishlist_bargains[i])) {
                        wishlist_bargains[i] = [];
                    }*/
                    row.appendChild(td_name);

                    // Price 
                    const td_price = document.createElement('td');

                    // If not definded calc: "unit_price" / 1000 * smallest amount from "amount"
                    if(bargains[j].price === null){
                        const min_amount = bargains[j].amount.match(/^\d+/);
                        td_price.textContent = parseInt(bargains[j].unit_price / 1000 * min_amount[0]);
                    } else {
                        td_price.textContent = bargains[j].price;
                    }
                    row.appendChild(td_price);

                    // Amount
                    const td_amount = document.createElement('td');
                    td_amount.textContent = bargains[j].amount + bargains[j].unit;
                    row.appendChild(td_amount);

                    // Unit Price
                    const td_unit_price = document.createElement('td');
                    if(bargains[j].unit_price !== null && bargains[j].unit_price.toString().includes('.')){
                        td_unit_price.textContent = bargains[j].unit_price.toString().replace('.', ',') + ' ' + bargains[j].unit_to_price;
                    } else {
                        td_unit_price.textContent = bargains[j].unit_price + ' ' + bargains[j].unit_to_price;
                    }
                    row.appendChild(td_unit_price);
                    
                    table_body.appendChild(row);

                    wishlist_bargains[i].items.push({ 
                        name: td_name.textContent, 
                        price: td_price.textContent, 
                        amount: bargains[j].amount,
                        min_amount: bargains[j].min_amount,
                        unit: bargains[j].unit, 
                        unit_price: bargains[j].unit_price,
                        unit_to_price: bargains[j].unit_to_price
                    });
                }
            }

            if (!product_found){
                console.log(`${wish_list[i]}: blev ikke fundet`)
                delete wishlist_bargains[i];
            }
        }
console.log(wishlist_bargains);

        document.getElementById("result_id").style.visibility = "visible";
        document.getElementById("send_wish_req").disabled = false;
    });

    document.getElementById('filter_amount').addEventListener('click', () => {
        price_up_and_down('filter_amount', wishlist_bargains);
    })

    document.getElementById('filter_unit_price').addEventListener('click', () => {
        price_up_and_down('filter_unit_price', wishlist_bargains);
    })

};

function is_valid_input(value) {
    const regex = /^[a-zA-ZæøåÆØÅ0-9,.\-\s]+$/; // only (, - . letters and numbers)
    return regex.test(value);
}

window.addEventListener('pageshow', async () => {
    // Get bargains
    const bargains_raw = await fetch('/api/bargains');
    const bargains = await bargains_raw.json();
    console.log('Number of bargains:', bargains.length);
    console.log('Offer retrieved from DB:', bargains);

    get_bargains(bargains);
});

// Filter price up to down and vice versa
function price_up_and_down(button_id, wishlist_bargains){
    document.getElementById(button_id).disabled = true;
    let button_name = document.getElementById(button_id);

    // Stop Filter if the array is empty
    if(wishlist_bargains.length === 0){
        document.getElementById(button_id).disabled = false;
        return;
    }

    let category = 'unit_price';
    if(button_id === 'filter_amount'){
        category = 'min_amount';
    }

    if(button_name.textContent.includes('⬇️')){
        // Cheapest first filter
        button_name.textContent = button_name.textContent.replace('⬇️', '⬆️');
        for(let i = 0; i < wishlist_bargains.length; i++){
            wishlist_bargains[i].items.sort((a, b) => { return a[category] - b[category]; });
        }
        update_table(wishlist_bargains);  
        
    } else {
        // Expensive first filter
        button_name.textContent = button_name.textContent.replace('⬆️', '⬇️');
        for(let i = 0; i < wishlist_bargains.length; i++){
            wishlist_bargains[i].items.sort((a, b) => { return b[category] - a[category]; });
        }
        update_table(wishlist_bargains);
    }

    document.getElementById(button_id).disabled = false;
}

function update_table(wishlist_bargains){
    const table_body = document.querySelector('#result_id tbody');
    table_body.textContent = ''; // Clear previous data

    // Find the items from wishlist from the bargains
    for (let i = 0; i < wishlist_bargains.length; i++){
        for (let j = 0; j < wishlist_bargains[i].items.length; j++){
            // Create row and cells
            const row = document.createElement('tr');

            // Name
            const td_name = document.createElement('td');
            td_name.textContent = wishlist_bargains[i].items[j].name;
            row.appendChild(td_name);

            // Price 
            const td_price = document.createElement('td');
            td_price.textContent = wishlist_bargains[i].items[j].price;
            row.appendChild(td_price);

            // Amount
            const td_amount = document.createElement('td');
            td_amount.textContent = wishlist_bargains[i].items[j].amount + wishlist_bargains[i].items[j].unit;
            row.appendChild(td_amount);

            // Unit Price
            const td_unit_price = document.createElement('td');
            if(wishlist_bargains[i].items[j].unit_price.toString().includes('.')){
                td_unit_price.textContent = wishlist_bargains[i].items[j].unit_price.toString().replace('.', ',') + ' ' + wishlist_bargains[i].items[j].unit_to_price;
            } else {
                td_unit_price.textContent = wishlist_bargains[i].items[j].unit_price + ' ' + wishlist_bargains[i].items[j].unit_to_price;
            }
            row.appendChild(td_unit_price);
            table_body.appendChild(row);
        }
    }
}

function cal_trilogi(){
    // Price

    // Amount

    // Unit price

}