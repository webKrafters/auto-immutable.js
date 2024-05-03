declare const sourceData: {
    _id: string;
    about: string;
    address: string;
    age: number;
    balance: string;
    company: string;
    email: string;
    eyeColor: string;
    favoriteFruit: string;
    friends: {
        id: number;
        name: {
            first: string;
            last: string;
        };
    }[];
    gender: string;
    greeting: string;
    guid: string;
    history: {
        places: {
            city: string;
            country: string;
            state: string;
            year: string;
        }[];
    };
    isActive: boolean;
    latitude: number;
    longitude: number;
    name: {
        first: string;
        last: string;
    };
    phone: {
        area: string;
        country: string;
        line: string;
        local: string;
    };
    picture: string;
    registered: {
        day: number;
        month: number;
        time: {
            hours: number;
            minutes: number;
            seconds: number;
        };
        timezone: string;
        year: number;
    };
    tags: string[];
};
export type SourceData = typeof sourceData;
declare const createSourceData: () => SourceData;
export default createSourceData;
