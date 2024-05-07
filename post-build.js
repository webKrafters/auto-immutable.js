var fs = require( 'fs' );
var path = require( 'path' );
const { promisify } = require( 'util' );

const read = promisify( fs.readFile );
const write = promisify( fs.writeFile );

const fOpts = { encoding: 'utf8' };

Promise
    .allSettled([
        read(
            path.join( 'docs-dev', 'src', 'images', 'logo.svg' ),
            fOpts
        ),
        read( 'logo.svg', fOpts )
    ])
    .then(([ officialLogo, appLogo ]) => {
        if( officialLogo.reason ) {
            throw new Error( officialLogo.reason );
        }
        if( appLogo.reason ) { appLogo.value = '' }
        if( appLogo.value === officialLogo.value ) { return }
        write( 'logo.svg', officialLogo.value, fOpts );
    })
    .catch( e => {
        console.log( 'FAILED TO PROCESS LOGO TRANSFER\n', e );
    } );