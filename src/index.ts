/* eslint-disable @typescript-eslint/no-misused-promises */
import readline from 'readline-sync';
import axios, { AxiosError } from 'axios';
import retry, { RetryOperation } from 'retry';

import { toBearerToken, toNewProduct } from './utils';
import { BearerToken, ProductType, TicketType } from './types';
import colors from 'colors';

const getBearerToken = async (): Promise<BearerToken> => {
    const email = readline.question(colors.bold('Please enter your Kide.app login email: '));
    const password = readline.question(colors.bold('Please enter your password: '), { hideEchoBack: true });
    const data = `client_id=56d9cbe22a58432b97c287eadda040df&grant_type=password&password=${password}&rememberMe=true&username=${email}`;
    try {
        const response = await axios.post("https://auth.kide.app/oauth2/token", data);
        return toBearerToken(response.data);
    } catch (e) {
        const error = e as AxiosError;
        if (error.response?.status === 400) {
            console.log(colors.red("Invalid email or password. Please try again."));
            return getBearerToken();
        }
        console.log(colors.red("**Login error, please try again!**"));
        return process.exit();
    }
};


const getProducts = async (): Promise<ProductType> => {
    const askProductURI = readline.question('Enter Kide.app link: ');
    const productURI = askProductURI.slice(askProductURI.lastIndexOf("/") + 1, askProductURI.length);

    const operation: RetryOperation = retry.operation({
        forever: true,
        minTimeout: 400,
        maxTimeout: 1000,
        randomize: true,
    });

    operation.attempt(async (currentAttempt) => {
        console.log(colors.blue(`*Trying to fetch tickets: ${currentAttempt} attempt*`));
        try {
            const res = await axios.get(`https://api.kide.app/api/products/${productURI}`);
            if (res.status === 400) {
                throw new Error(colors.red("Couldn't reserve ticket, trying again."));
            } else if (res.status === 200) {
                console.log(colors.green(colors.bold(`Successfully fetched tickets!`)));
                return toNewProduct(res.data);
            } else {
                throw new Error(colors.red("Ticket fetch error"));
            }

        } catch (e) {
            if (operation.retry((e as Error))) { return; }
            return;
        }
    });

    const res = await axios.get(`https://api.kide.app/api/products/${productURI}`);
    return toNewProduct(res.data);


};

const selectTickets = (products: ProductType): TicketType[] => {
    //Print ticket variants
    console.log('');
    products.tickets.forEach((ticket, index) => {
        console.log(colors.green("[" + index + "]" + " " + ticket.name + " \n    id: " + ticket.ticketId + " \n    stock amount: " + ticket.availability));
        console.log('');
    });

    const selectedIndexes = readline.question('Enter index of wanted ticket');
    console.log('');


    const selectedTickets = products.tickets.filter((_, index) => index.toString() === selectedIndexes);

    console.log('Selected tickets: ');
    selectedTickets.forEach((ticket) => {
        console.log(colors.bold("*SELECTED* " + ticket.name + " \n    id: " + ticket.ticketId + " \n    stock amount: " + ticket.availability));
        console.log('');
    });

    return selectedTickets;

};

const reserve = (token: BearerToken, ticket: TicketType): void => {
    const bear = token.token_type + " " + token.access_token;

    const operation: RetryOperation = retry.operation({
        forever: true,
        minTimeout: 2000,
        maxTimeout: 5000,
        randomize: true,

    });

    const data = {
        toCreate: [{
            "inventoryId": ticket.ticketId,
            "quantity": 1,
            "productVariantUserForm": null,
        }],
        toCancel: []
    };

    operation.attempt(async (currentAttempt) => {
        console.log(colors.blue(`*Trying to reserve selected tickets: ${currentAttempt} attempt*`));
        try {
            const res = await axios.post("https://api.kide.app/api/reservations", data, { headers: { 'Authorization': bear } });
            if (res.status === 400) {
                throw new Error(colors.red("Couldn't reserve ticket, trying again."));
            } else if (res.status === 200) {
                console.log(colors.green(colors.bold(`Successfully reserved ticket!`)));
            } else {
                throw new Error(colors.red("Unexpected error"));
            }
        } catch (e) {
            if (operation.retry((e as Error))) { return; }
        }
    });
};


const init = async (): Promise<void> => {
    const token = await getBearerToken();
    const products = await getProducts();
    const tickets = selectTickets(products);
    void reserve(token, tickets[0]);
};

void init();
