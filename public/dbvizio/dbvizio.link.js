/**
 * DBvizio.Link constructor
 *
 * @param $sourceTable
 * @param $sourceColumn
 * @param $targetTable
 * @param $targetColumn
 * @param $svgPath
 * @constructor
 */
DBvizio.Link = function($sourceTable, $sourceColumn,
                        $targetTable, $targetColumn,
                        $svgPath) {

    this.$sourceTable              = $sourceTable;
    this.sourceTable               = $sourceTable.attr('id');
    this.$sourceColumn             = $sourceColumn;
    this.sourceColumn              = $sourceColumn.attr('id');
    this.sourceColumnRelativeOrder = 0;
    this.sourceColumnLinkCount     = 0;
    this.$targetTable              = $targetTable;
    this.targetTable               = $targetTable.attr('id');
    this.$targetColumn             = $targetColumn;
    this.targetColumn              = $targetColumn.attr('id');
    this.targetColumnRelativeOrder = 0;
    this.targetColumnLinkCount     = 0;
    this.$svgPath                  = $svgPath;

    this.id = this.sourceColumn + '->' + this.targetColumn;

    this.mode = 'square';
};

/**
 *
 * @return {DBvizio.Link}
 */
DBvizio.Link.prototype.draw = function() {
    this.$svgPath.attr('d', this.computePath());

    return this;
};

/**
 * Compute path definition from 2 (jQuery) dom elements
 *
 * @return {String}
 */
DBvizio.Link.prototype.computePath = function() {

    var $a, $b,
        aPos, bPos,
        aWidth, bWidth,
        aHeight, bHeight,
        start, mid, end,
        aHeightMult = 0.5,
        bHeightMult = 0.5,
        pathDef,
        tmp;

    if (this.$sourceColumn.is(':visible')) {
        $a = this.$sourceColumn;
        aHeightMult = ++this.sourceColumnRelativeOrder / ++this.sourceColumnLinkCount;
    } else {
        $a = this.$sourceTable.find('h2');
    }

    if (this.$targetColumn.is(':visible')) {
        $b = this.$targetColumn;
        bHeightMult = ++this.targetColumnRelativeOrder / this.targetColumnLinkCount;
    } else {
        $b = this.$targetTable.find('h2');
    }

    //console.log(aHeightMult, bHeightMult);

    aPos = $a.offset();
    bPos = $b.offset();

    if (bPos.left < aPos.left) {
        tmp = $a;
        $a = $b;
        $b = tmp;

        tmp = aPos;
        aPos = bPos;
        bPos = tmp;

        tmp = aHeightMult;
        aHeightMult = bHeightMult;
        bHeightMult = tmp;
    }

    aWidth  = $a.outerWidth();
    aHeight = $a.outerHeight();
    bWidth  = $b.outerWidth();
    bHeight = $b.outerHeight();

    //console.log(aHeight, aHeightMult, aHeight * aHeightMult, bHeight, bHeightMult, bHeight * bHeightMult);

    start = {
        x:  aPos.left,
        xx: aPos.left + aWidth,
        y:  aPos.top + aHeight / 2
    };
    end = {
        x:  bPos.left,
        xx: bPos.left + bWidth,
        y:  bPos.top + bHeight / 2
    };
    if (end.x > start.x + aWidth) {
        start.x = start.x + aWidth;
    }

    mid = {
        x: start.x + (end.x - start.x) / 2,
        y: start.y + (end.y - start.y) / 2
    };
    if (start.xx >= end.x) {
        mid.x = start.x - 20;
    }

    if (this.mode === 'square') {
        if (Math.abs(end.y - start.y) < 10) {
            pathDef = 'M' + start.x + ',' + start.y +
                      'L' + end.x   + ',' + end.y;
        } else {
            pathDef = 'M' + start.x + ',' + start.y +
                      'H' + mid.x   +
                      'V' + end.y   +
                      'H' + end.x;
        }
    } else if (this.mode === 'round') {
        pathDef = 'M' + start.x + ',' + start.y +
                  'Q' + mid.x   + ',' + start.y + ' ' + mid.x + ',' + mid.y +
                  'Q' + mid.x   + ',' + end.y   + ' ' + end.x + ',' + end.y;
    } else {
        throw new Error('invalid path mode :' + this.pathMode);
    }

    return pathDef;
};