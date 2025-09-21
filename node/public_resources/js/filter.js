import { update_table } from "./table.js";

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
        // Expensive first filter
        button_name.textContent = button_name.textContent.replace('⬇️', '⬆️');
        for(let i = 0; i < wishlist_bargains.length; i++){
            wishlist_bargains[i].items.sort((a, b) => { return b[category] - a[category]; });
        }
        update_table(wishlist_bargains);
        
    } else {
        // Cheapest first filter
        button_name.textContent = button_name.textContent.replace('⬆️', '⬇️');
        for(let i = 0; i < wishlist_bargains.length; i++){
            wishlist_bargains[i].items.sort((a, b) => { return a[category] - b[category]; });
        }
        update_table(wishlist_bargains);
        
    }

    document.getElementById(button_id).disabled = false;
}

export { price_up_and_down };