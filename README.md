# Notes API

## Environment Variables

```env
PORT=6767
NODE_ENV=development
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=notes
ALLOWED_ORIGINS=http://localhost:3000
```

## API Endpoints

### Notes

#### Get All Notes

```
GET /api/notes
```

Query Parameters:

- `archived` - Filter by archived status (true/false)
- `tag` - Filter by tag name
- `search` - Search in title and description

#### Get Note by ID

```
GET /api/notes/:id
```

#### Create Note

```
POST /api/notes
Content-Type: application/json

{
  "title": "Note Title",
  "description": "Note description",
  "color": "#ff6b6b",
  "tags": ["work", "important"]
}
```

#### Update Note

```
PATCH /api/notes/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "color": "#00d2ff",
  "tags": ["updated", "new-tag"]
}
```

#### Delete Note

```
DELETE /api/notes/:id
```

#### Toggle Archive Status

```
PATCH /api/notes/:id/archive
```

#### Bulk Delete Notes

```
POST /api/notes/bulk-delete
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

### Tags

#### Get All Tags

```
GET /api/tags
```

Returns all tags with usage count.
