export  interface BearerToken {
    access_token: string,
    token_type: string,
}

export interface ProductType {
    productName: string,
    tickets: TicketType[]
}

export interface TicketType {
    ticketId: string,
    name: string,
    price: number,
    availability: number,
}
