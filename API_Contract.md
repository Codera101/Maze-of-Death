# API Contract

## 1. Room

### Handle Join Player
- name : `{join_player}`
- param : `{username : string}`
- returns :
```js
{
    current_player: {
        id: string,
        username: string,
        score:int,
        health:int,
        kill_count:int,
    }
}
```
 on `{player_joined}`

<!-- ### Handle Join Viewer
- name : `{join_viewer}`
- param : `{}`
- return : `{}` on `{viewer_joined}` -->

### Draw

- returns: `{}`
    ```js
    {
        maze: {
                row:int,
                col:int,
                layout: boolean[][]
                }
    } 
    ```
    on `{draw_maze}`

### Refresh Visible Players
- returns: `{}`
    ```js
    {
        visible_player_list:[
            username:string,
            id: string,
            x: int,
            y: int,
            dir:string,
            color: string,
        ]             
    } 
    ```
    on `{refresh_players}`


## 2. Player


### Move

- name : `{player_move}`
- param : `{dir : string}`
- returns :
    ```js
    {
        status:boolean
    }
    ```
    on `{player_moved}`


### Shoot

- name : `{shoot}`
- param : `{}`
- returns :
```js
{
    status:boolean
}
``` 
on `{target_hit}`

### Hit Recieved

- name : `{}`
- param : `{}`
- returns :
```js
{
    dir: string,
    shooter_name: string
}
``` 
on `{got_hit}`

### Death

- name : `{}`
- param : `{}`
- returns : 
```js
{
    killer_name: string,
    respawn_time: int
}
``` 
on `{died}`

### Respawn

- name : `{}`
- param : `{}`
- returns : 
```js
{
    id: string,
    username:string,
    x: int,
    y: int,    
    bullets:int,
    health:int,
    score:int,
    kill_count:int,
    dir:string,
    color: string,
}
``` 
on `{respawn_done}`


## 3. Panel

### Refresh Player Stats

- name : `{}`
- param : `{}`
- returns : 
```js
{
    id:string,
    username: string,
    health: int,
    score:int,
    bullets: int
    kill_count:int,
}
``` 
on `{refresh_player}`


### Broadcast Kill Message

- name : `{}`
- param : `{}`
- returns : 
```js
{
    victim_name: string,
    killer_name: string,
}
``` 
on `{kill_message}`

### Refresh Ranking

- name : `{}`
- param : `{}`
- returns : 
```js
{   
    all_players: [
        username:string,
        score:int,
        kill_count: int
        color:string,
    ]
}
``` 
on `{refresh_rank}`
