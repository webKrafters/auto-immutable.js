const {
    Immutable,
    constants,
    Tag
} = require( './dist' );

module.exports.default = Immutable;
module.exports.Immutable = Immutable;
module.exports.Tag = Tag;
for( var c in constants ) {
    module.exports[ c ] = constants[ c ];
}