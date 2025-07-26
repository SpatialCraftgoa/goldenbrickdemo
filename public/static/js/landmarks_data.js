/**
 * Unified Landmark Data for Dubai Map
 * Contains both coordinates and SVG icon information
 */
var dubaiLandmarks = {
    "type": "FeatureCollection",
    "name": "dubai_landmarks",
    "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
    "features": [
        {
            "type": "Feature",
            "properties": {
                "id": 1,
                "name": "The Frame",
                "description": "Dubai Frame - A magnificent architectural landmark offering panoramic views of old and new Dubai",
                "category": "attraction",
                "icon": {
                    "filename": "embedded.svg",
                    "url": "/static/images/markers/embedded.svg",
                    "size": [57, 86],
                    "anchor": [28.5, 43]
                }
            },
            "geometry": {
                "type": "Point",
                "coordinates": [55.300403556872531, 25.235495908583776]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": 2,
                "name": "Majan",
                "description": "Majan - Luxury residential development in Dubai",
                "category": "residential",
                "icon": {
                    "filename": "embedded_1.svg",
                    "url": "/static/images/markers/embedded_1.svg",
                    "size": [57, 57],
                    "anchor": [28.5, 28.5]
                }
            },
            "geometry": {
                "type": "Point",
                "coordinates": [55.318397548486423, 25.091450215525903]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": 3,
                "name": "Burj Al Arab",
                "description": "Burj Al Arab - The world's only 7-star hotel, an iconic sail-shaped luxury resort",
                "category": "hotel",
                "icon": {
                    "filename": "embedded_2.svg",
                    "url": "/static/images/markers/embedded_2.svg",
                    "size": [57, 86],
                    "anchor": [28.5, 43]
                }
            },
            "geometry": {
                "type": "Point",
                "coordinates": [55.185176742133009, 25.141559395804116]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": 4,
                "name": "Burj Khalifa",
                "description": "Burj Khalifa - The world's tallest building and Dubai's most famous skyscraper",
                "category": "skyscraper",
                "icon": {
                    "filename": "embedded_3.svg",
                    "url": "/static/images/markers/embedded_3.svg",
                    "size": [57, 86],
                    "anchor": [28.5, 43]
                }
            },
            "geometry": {
                "type": "Point",
                "coordinates": [55.274192567705008, 25.197624601005231]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": 5,
                "name": "Creek Vistas",
                "description": "Creek Vistas - Premium waterfront residential towers overlooking Dubai Creek",
                "category": "residential",
                "icon": {
                    "filename": "embedded_4.svg",
                    "url": "/static/images/markers/embedded_4.svg",
                    "size": [57, 86],
                    "anchor": [28.5, 43]
                }
            },
            "geometry": {
                "type": "Point",
                "coordinates": [55.304205576204609, 25.180092096494011]
            }
        }
    ]
};

// Helper function to get landmark by ID
function getLandmarkById(id) {
    return dubaiLandmarks.features.find(feature => feature.properties.id === id);
}

// Helper function to get all landmark icons
function getAllLandmarkIcons() {
    const icons = {};
    dubaiLandmarks.features.forEach(feature => {
        const props = feature.properties;
        icons[props.id] = props.icon;
    });
    return icons;
}

// Helper function to get landmarks by category
function getLandmarksByCategory(category) {
    return dubaiLandmarks.features.filter(feature => 
        feature.properties.category === category
    );
}
