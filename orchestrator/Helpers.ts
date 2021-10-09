function compactRange(rangeArr: string[][]): string[][] {
    return rangeArr.filter(row => row.some(cell => !['', null, undefined].includes(cell)));
}
