var childProcess = require( 'child_process' );

var fs = require( 'fs' );

var path = require( 'path' );

process.chdir( path.join( __dirname, 'docs-dev' ) );

childProcess.execSync( 'npm install' );

childProcess.execSync( 'npm run build' );

process.chdir( __dirname );

fs.cp(
    path.join( __dirname, 'docs-dev', 'public' ),
    path.join( __dirname, 'docs' ),
    function( err ) {
        err
            ? console.error( err )
            : console.log( 'Site deployment complete.' );

    }
);
