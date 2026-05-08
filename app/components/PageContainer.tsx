import { Container, ContainerProps } from "@mantine/core";

type Props = {
  children: React.ReactNode;
  size?: ContainerProps["size"];
};

export function PageContainer({ children, size = "lg" }: Props) {
  return (
    <Container size={size} py={48} px="lg">
      {children}
    </Container>
  );
}
