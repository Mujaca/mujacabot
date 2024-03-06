interface Image {
    url: string,
    width: number,
    height: number
}

export interface Role{
    id: string,
    team: string,
    aura: string,
    name: string,
    description: string,
    image: Image
}

interface roleMapping {
    [role:string]: string[]
}

export interface RoleList {
    roles: Role[],
    advancedRolesMapping: roleMapping
    randomRolesMapping: roleMapping,
    rankedRandomExcludedRoles: string[]
}

export interface Item {
    id: string,
    name?: string,
    rarity: string,
}

export interface avatarItem extends Item{
    imageUrl: string,
    type: string,
    costInGold: number
}

export interface avatarItemSet {
    id: string,
    avatarItemIds: string[],
    promoImageUrl: string,
    promoImagePrimaryColor: string,
}

export interface avatarItemCollection extends avatarItemSets {
    iconUrl: string,
    bonusLoadingScreenId: string,
    bonusMinItemCount: number
}

export interface profileIcon extends Item{}

export interface emojis extends Item{
    urlPreview: string,
    urlAnimation: string,
    event: string
}

export interface emojiCollection{
    id: string,
    emojiIds: string[],
    promoImageUrl: string,
    promoImagePrimaryColor: string,
    iconUrl: string,
    bonusLoadingScreenId: string,
    bonusMinItemCount: number
}

export interface background extends Item{
    imageDay: Image,
    imageDayWide: Image,
    imageNight: Image,
    imageNightWide: Image
    imageDaySmall: Image,
    imageNightSmall: Image
    backgroundColorDay: string,
    backgroundColorNight: string
}

export interface loadingScreen extends Item{
    image: Image,
    imageWide: Image,
    imagePrimaryColor: string,
}