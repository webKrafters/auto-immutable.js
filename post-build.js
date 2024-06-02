var fs = require( 'fs' );
var path = require( 'path' );
const { promisify } = require( 'util' );

const copyFile = promisify( fs.copyFile );
const read = promisify( fs.readFile );
const write = promisify( fs.writeFile );

const LOGO_FILENAME = 'logo.svg';

const LOGO_SOURCEPATH = path.join( 'docs-dev', 'src', 'images', LOGO_FILENAME );

const fOpts = { encoding: 'utf8' };

Promise
    .allSettled([
        read( LOGO_SOURCEPATH, fOpts ),
        read( LOGO_FILENAME, fOpts )
    ])
    .then(([ officialLogo, appLogo ]) => {
        if( officialLogo.reason ) {
            throw new Error( officialLogo.reason );
        }
        if( appLogo.reason ) { appLogo.value = '' }
        if( appLogo.value === officialLogo.value ) { return }
        return copyFile( LOGO_SOURCEPATH, LOGO_FILENAME );
    })
    .catch( e => {
        console.log( 'FAILED TO PROCESS LOGO TRANSFER\n', e );
    } );