// Update table with user's wishlist
function update_table(wishlist_bargains){
    const table_body = document.querySelector('#result_id tbody');
    table_body.textContent = ''; // Clear previous data

    // Find the items from wishlist from the bargains
    for (let i = 0; i < wishlist_bargains.length; i++){
        if(!wishlist_bargains[i]){
            continue;
        }
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
            if(wishlist_bargains[i].items[j].unit_price !== null && wishlist_bargains[i].items[j].unit_price.toString().includes('.')){
                td_unit_price.textContent = wishlist_bargains[i].items[j].unit_price.toString().replace('.', ',') + ' ' + wishlist_bargains[i].items[j].unit_to_price;
            } else {
                td_unit_price.textContent = wishlist_bargains[i].items[j].unit_price + ' ' + wishlist_bargains[i].items[j].unit_to_price;
            }
            row.appendChild(td_unit_price);
            table_body.appendChild(row);
        }

        // End of item category, add different color
        const lastRow = table_body.querySelector("tr:last-child");
        if (i !== wishlist_bargains.length - 1) {
            lastRow.querySelectorAll("td").forEach(td => {
                td.style.borderBottom = "2px solid var(--solid-border-color)";
            });
        }
    }
}

export { update_table };