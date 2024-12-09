import { Badge, Box, Group, Typography } from "@tidbcloud/uikit";

export function Header() {
  return (
    <Box
      component="header"
      h={64}
      className="app-header"
      sx={{ display: "flex", alignItems: "center" }}
      p={24}
    >
      <Group>
        <Typography variant="headline-md">TiInsight</Typography>
        <Badge variant="outline">Experimental</Badge>
      </Group>
    </Box>
  );
}
