const { createExcel } = require('../src/excel.js');

(async () => {
    await createExcel('00000000-0000-0000-0000-000000000000', {
        thumbnail: 'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/Listing%20Photos/Circle/89332401/L/265811231_mobile.jpg',
        title: 'Blk 710 Clementi West Street 2',
        price: 700,
        sqm: 68,
        sqft: 731.95,
        room: '2 Beds, 1 Baths',
        recency: new Date('2020-11-21T08:21:59.000Z'),
        detail_url: 'https://www.stproperty.sg/listings/89332401/for-rent-clementi-west-street-2-clementi-west-mins-to-clementi-mrt',
        detail: {
            name: 'Blk 710 Clementi West Street 2 (Clementi), HDB 3 Rooms - For Rent',
            desc: 'Room Rental. Blk 710,Chinese mix Malay Muslim hse \n  No pork / light cook as boil water for cup noodles only \n  Prefer Chinese msian 1f / couple only \n  Wifi ( no bed set ) \n  @$700/- Immed \n   \n  Pls call agt gloria 9008-1003 to view \n  Stamp fee apply on tenants if deal close',
            info: {
                'Room Type': 'Common',
                'Available from': 'Now',
                'Lease Term': '1 year',
                'Furnish': 'Fully Furnished',
                'Take Over': 'No',
                'Date Listed': '1605946919',
                'Address': '710 Clementi West Street 2 (120710)',
                'Property Name': 'Clementi West Street 2',
                'Property Type': 'HDB 3 Rooms',
                'Bedrooms': '2',
                'Bathrooms': '1',
                'Floor Level': 'HIGH',
                'Tenure': 'LEASEHOLD/99 years',
                'Built Year': '1984',
                'HDB Town': 'Clementi'
            },
            facilities: [
                'Water Heater'
            ],
            map: 'https://maps.googleapis.com/maps/api/staticmap?size=640x640&markers=icon%3Ahttps%3A%2F%2Fmaps.gstatic.com%2Fmapfiles%2Fapi-3%2Fimages%2Fspotlight-poi2.png%7C1.30628911866%2C103.761518108&key=AIzaSyC0ENVSN8x7-3OvvSQjLckO_j7Jxn18JYM',
            photos: [
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/Listing%20Photos/Circle/89332401/L/265811231_mobile.jpg?20201113144535',
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/Listing%20Photos/Circle/89332401/L/265811221_mobile.jpg?20201113144535',
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/Listing%20Photos/Circle/89332401/L/265811201_mobile.jpg?20201113144534',
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/Listing%20Photos/Circle/89332401/L/265811211_mobile.jpg?20201113144534',
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/HDB%20Block%20Photos/120710/L/206422.jpg',
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/HDB%20Block%20Photos/120710/L/206432.jpg',
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/HDB%20Block%20Photos/120710/L/206442.jpg',
                'https://s3-ap-southeast-1.amazonaws.com/static.streetsine/HDB%20Block%20Photos/120710/L/206452.jpg'
            ]
        }
    });
})();
