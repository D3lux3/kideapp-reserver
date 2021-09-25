import { BearerToken, ProductType, TicketType } from "./types";

type TokenFields = { access_token: unknown, token_type: unknown };

type TicketVariantFields = {
    inventoryId: unknown,
    pricePerItem: unknown,
    availability: unknown
};

type ProductFields = {
    model: {
        product: {
            name: unknown
        },
        variants: TicketVariantFields[]
    }
};

export const toBearerToken = ({ access_token, token_type }: TokenFields): BearerToken => {
    const token: BearerToken = {
        access_token: parseString(access_token),
        token_type: parseTokenType(parseString(token_type))
    };

    return token;
};

export const toNewProduct = ({ model }: ProductFields): ProductType => {
    const newProduct: ProductType = {
        productName: parseString(model.product.name),
        tickets: toTicketTypes(model.variants)
    };

    return newProduct;
};

const toTicketTypes = (object: TicketVariantFields[]): TicketType[] => {
    return object.map((o) => parseTicketVariant(o));
};

const parseTicketVariant = ({ inventoryId, pricePerItem, availability }: TicketVariantFields): TicketType => {
    if (!isString(inventoryId) || !isNumber(pricePerItem) || !isNumber(availability)) {
        throw new Error("Ticket variant is invalid");
    }
    return {
        ticketId: inventoryId,
        price: pricePerItem,
        availability: availability
    };
};

const parseString = (param: unknown): string => {
    if (!isString(param) || !param) {
        throw new Error("Type of param is incorreect");
    }

    return param;
};

const parseTokenType = (param: string): string => {
    if (!isString(param) && param === 'bearer') {
        throw new Error("Token type is not Bearer");
    }
    return param.charAt(0).toUpperCase() + param.slice(1);
};

const isNumber = (object: unknown): object is number => {
    return typeof object === 'number' && !isNaN(+object);
};

const isString = (object: unknown): object is string => {
    return typeof object === 'string' || object instanceof String;
};

