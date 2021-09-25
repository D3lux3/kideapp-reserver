import readline from 'readline-sync';

import axios from 'axios';
import { toBearerToken, toNewProduct } from './utils';
import { BearerToken, ProductType } from './types';


const getBearerToken = async (): Promise<BearerToken> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const email = readline.question('Please enter your Kide.app login email: ');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const password = readline.question('Please enter your password: ', { hideEchoBack: true });
    const data = `client_id=56d9cbe22a58432b97c287eadda040df&grant_type=password&password=${password}&rememberMe=true&username=${email}`;
    const token = await axios.post("https://auth.kide.app/oauth2/token", data);
    return toBearerToken(token.data);
};


const getProducts = async (): Promise<ProductType> => {
    const askProductURI = readline.question('Enter Kide.app link: ');
    const productURI = askProductURI.slice(askProductURI.lastIndexOf("/") + 1, askProductURI.length);
    const res = await axios.get(`https://api.kide.app/api/products/${productURI}`);
    return toNewProduct(res.data);
};


const addAllTicketsToCart = async (): Promise<void> => {
    const token = await getBearerToken();
    const bear = token.token_type + " " + token.access_token;
    const products = await getProducts();

    const ticket = products.tickets[0];
    const ticket2 = products.tickets[1];
    const data = {
        "toCreate": [
            {
                "inventoryId": ticket.ticketId,
                "quantity": 1,
                "productVariantUserForm": null
            },
            {
                "inventoryId": ticket2.ticketId,
                "quantity": 1,
                "productVariantUserForm": null
            }
        ],
        "toCancel": []
    };

    const res = await axios.post("https://api.kide.app/api/reservations/batched", data, {headers: { 'Authorization': bear }});
    console.log(res);
};

void addAllTicketsToCart();
