async function get_offers(){
    let offers;
    document.getElementById('get_offers').addEventListener('click', async () => {

        // Save data via scrape
        const save_res = await fetch('/api/offers/save');
        const save_data = await save_res.json();
        console.log(save_data.message);

        // Get data from DB
        const offers_raw = await fetch('/api/offers');
        offers = await offers_raw.json();

        console.log('Antal tilbud fundet:', offers.length);
        console.log('Tilbud hentet fra DB:', offers);
    });

    document.getElementById('send_wish_req').addEventListener('click', () => {
        let invalid_input_found = false;
        let wish_list = [];
        // Array fields
        document.querySelectorAll('#array_data_table input').forEach(input => {
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
                    console.log(`Value: ${index} is, ${value}`);
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

        for (let i = 0; i < wish_list.length; i++){
            let product_found = false;

            for (let j = 0; j < offers.length; j++){
                if(wish_list[i].toLowerCase() === offers[j].name.toLowerCase()){
                    product_found = true
                    console.log(`${wish_list[i]}: blev fundet i tilbuds avisen, til ${offers[j].price}`);
                    break;
                }
            }

            if (!product_found){
                console.log(`${wish_list[i]}: blev ikke fundet`)
            }
        }
        
    });

};

function is_valid_input(value) {
    const regex = /^[a-zA-ZæøåÆØÅ0-9,.\-\s]+$/; // only (, - . letters and numbers)
    return regex.test(value);
}

window.addEventListener('pageshow', () => {
    get_offers();
});