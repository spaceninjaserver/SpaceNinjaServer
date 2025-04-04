import { JSONParse } from "json-with-bigint";

export const getJSONfromString = <T>(str: string): T => {
    const jsonSubstring = str.substring(0, str.lastIndexOf("}") + 1);
    return JSONParse<T>(jsonSubstring);
};

export const getSubstringFromKeyword = (str: string, keyword: string): string => {
    const index = str.indexOf(keyword);
    if (index == -1) {
        throw new Error(`keyword ${keyword} not found in string ${str}`);
    }
    return str.substring(index);
};

export const getSubstringFromKeywordToKeyword = (str: string, keywordBegin: string, keywordEnd: string): string => {
    const beginIndex = str.lastIndexOf(keywordBegin) + 1;
    const endIndex = str.indexOf(keywordEnd);
    return str.substring(beginIndex, endIndex + 1);
};

export const getIndexAfter = (str: string, searchWord: string): number => {
    const index = str.indexOf(searchWord);
    if (index === -1) {
        return -1;
    }
    return index + searchWord.length;
};

export const regexEscape = (str: string): string => {
    str = str.split(".").join("\\.");
    str = str.split("\\").join("\\\\");
    str = str.split("[").join("\\[");
    str = str.split("]").join("\\]");
    str = str.split("+").join("\\+");
    str = str.split("*").join("\\*");
    str = str.split("$").join("\\$");
    str = str.split("^").join("\\^");
    str = str.split("?").join("\\?");
    str = str.split("|").join("\\|");
    str = str.split("(").join("\\(");
    str = str.split(")").join("\\)");
    str = str.split("{").join("\\{");
    str = str.split("}").join("\\}");
    return str;
};
