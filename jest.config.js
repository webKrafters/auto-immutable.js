module.exports = {
    collectCoverageFrom: [ 'src/**/*.ts' ],
    coveragePathIgnorePatterns: [
        '<rootDir>/src/\\$global.ts',
        '<rootDir>/src/test-artifacts',
        '<rootDir>/src/types.ts',
    ],
    detectOpenHandles: true,
    globals: {
        'ts-jest': {
            diagnostics: {
                ignoreCodes: [
                    2322,
                    2353,
                    2571,
                    2741,
                    6031,
                    18003
                ]
            }
        }
    },
    preset: 'ts-jest',
    testEnvironment: 'node',
    // transform: { '\\.tsx?$': 'ts-jest' }
};
