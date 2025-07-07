import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  useScrollTrigger,
  Slide,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showAppBar?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

interface HideOnScrollProps {
  children: React.ReactElement;
}

function HideOnScroll(props: HideOnScrollProps) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Quranic Recitation Analysis',
  showAppBar = true,
  maxWidth = 'lg',
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showAppBar && (
        <HideOnScroll>
          <AppBar position="fixed" elevation={1}>
            <Toolbar>
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  flexGrow: 1,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                {title}
              </Typography>
            </Toolbar>
          </AppBar>
        </HideOnScroll>
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: showAppBar ? 8 : 0,
          pb: 2,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth={maxWidth} sx={{ py: 2 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;