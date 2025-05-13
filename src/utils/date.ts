const dateFormatter = new Intl.DateTimeFormat(undefined)

export const formatDate = (gameDate: Date | string): string => {
    return  dateFormatter.format(new Date(gameDate));

}