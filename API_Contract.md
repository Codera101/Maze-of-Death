# API Contract

## 1. Room

### Handle Join Player

- name : `{player_join}`
- param : `{username : string}`
- return `{room_id : string, maze : arr[][]}` on `{joined_player}`
- note : `arr[i][j]` is an object : `{player,obstacle,empty}`

### Handle Join Viewer

- name : `{viewer_join}`
- param : `{}`
- return `{room_id:string, maze : arr[][]}` on `{joined_viewer}`

## 2. Maze

### Maze Creation

- name : `{create_maze}`
- param : `{}`
- return : `{obstacles: array[][]}` on `{maze_done}`

## 3. Player

### Move

- name : `{player_move}`
- param : `{dir : string}`
- return : `{new_x : int, new_y : int}` on `{player_moved}`

### Shoot

- name : `{shoot}`
- param : `{}`
- return : `{kill_count : int,score : int}` on `{player_hit}`
- return : `{score: int,hp : int}` on `{got_hit}`
- return : `{}` on `{got_kill}`

## 4. Panel

### Refresh List

- name : `{shoot}`
- param : `{}`
- return : `{kill_count : int,score : int}` on `{player_hit}`
