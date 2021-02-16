module.exports = {
    future: {
        // removeDeprecatedGapUtilities: true,
        // purgeLayersByDefault: true,
    },
    purge: {
        enabled: true,
        content: ['./public/js/*.js', './public/*.html'],
    },
    theme: {
        extend: {},
    },
    variants: {},
    plugins: [],
};
