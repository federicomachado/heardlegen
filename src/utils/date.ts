const dateFormatter = new Intl.DateTimeFormat(undefined,{
  dateStyle: 'medium',  
  timeStyle: 'short'
})

export const formatDate = (gameDate: Date | string): string => {
    return  dateFormatter.format(new Date(gameDate));
}
