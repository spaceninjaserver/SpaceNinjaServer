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

// This is FNV1a-32 except operating under modulus 2^31 because JavaScript is stinky and likes producing negative integers out of nowhere.
export const catBreadHash = (name: string): number => {
    let hash = 2166136261;
    for (let i = 0; i != name.length; ++i) {
        hash = (hash ^ name.charCodeAt(i)) & 0x7fffffff;
        hash = (hash * 16777619) & 0x7fffffff;
    }
    return hash;
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
